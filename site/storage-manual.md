# GTNH-OC 存储、缓冲与自动进料设计

本文是 GTNH 2.9.0-beta-2（Minecraft 1.7.10、Java 17–25）对应的实现说明。它描述已经写入服务器账本的存储层、已经核对的 GTNH 接口，以及必须留给真人客户端确认的连接边界。

## 1. 设计结论

一键建厂的职责是创建一个可恢复的工艺拓扑：源仓、进料缓冲、过程缓冲、产品仓、残余仓、废液仓、尾气仓、端口过滤器和路由。蓝图从不创造任何物料；启动只打开调度器。真实物料必须先由 GTNH 设备或已经批准的外部端点进入源仓，缺料时工厂停在 `MISSING_FEED:<identity>`，缓冲满时停在 `BUFFER_FULL:<node>`。

存储层加入 `VaProcess.WorldState.storage`，与现有 `UnitService` 共用主线程冻结、工作线程求解、主线程再验证、单写入器落盘和重启恢复。因而“源仓—在途—目标仓”是同一个服务器权威快照的一部分，重复请求按请求 ID 和负载指纹返回原收据，不会再次扣料。

## 2. 三相和单位契约

每个节点固定 `phase` 与 `basis`：

| 相态 | basis | 例子 | 允许的身份 |
| --- | --- | --- | --- |
| `LIQUID` | `MB` | `aceticacid`、`ethanol`、`water` | GT `FluidRegistry` 名称或批准的 GT 材料流体 |
| `GAS` | `MB` | `acetylene`、`hydrogen`、尾气 | GT 流体/气体注册名；压力和温度仍是独立资格 |
| `SOLID` | `ITEM_STACK` | 催化剂、碱、滤饼 | item registry + meta + 必要 NBT |
| 教学投影 | `TEACHING_MOL` | 既有过程模型 | 只在明确的教学边界内使用 |

`mB` 不会静默解释成 mol，item stack 不会静默解释成质量或物质的量。若需要从 GT 流体映射到 OC 物种，必须在 `NativeMaterialAudit` 和 `PlantFluidBridge` 中存在精确身份；缺失映射就拒绝。

## 3. 已实现的数据模型

实现文件为 `mod/src/main/java/org/gtnhoc/chem/process/v2/StorageProcess.java`：

- `Node`：节点身份、相态、单位、容量、当前量、批次来源、温度/压力域和可选外部端点；
- `Route`：单向源/目标、相态/单位/身份过滤、每周期上限和启用状态；
- `Factory`：`ESTER` 或 `VITAMIN_A` 蓝图、首批需求、已进料量、阶段、阻塞原因和路由列表；
- `World`：拓扑版本、节点、路线、蓝图和请求收据；
- `Result`：`STARTED`、`FED`、`BLOCKED`、`ALREADY_COMMITTED` 等可读结果。

乙酸乙酯蓝图的首批需求为乙酸 1,000 mB、乙醇 1,000 mB、水 5,000 mB。三种源仓和三个进料缓冲彼此独立；反应、馏出液、水相、油相、残余、废水和产品节点已经预留。维生素 A 蓝图按原生液体、原生气体、固体辅料、工段缓冲、C6/C14 交接、产品隔离和残余/尾气分组，后续工段按同一节点契约扩展。

## 4. GTNH 接口证据和边界

本地保存的 GTNH 2.9.0-beta-2 源码核对结果如下：

1. `MTEHatchInput` / `MTEHatchOutput` 通过 Forge 流体端口提供 `IFluidHandler` 语义，输入仓有可配置的配方过滤和有限容量；
2. `MTEFluidPipe` 以及 GT 流体管道把流体/气体作为 `FluidStack` 搬运，方向、材料耐受和多流体管道是管道层职责；
3. EnderIO `EnderLiquidConduitNetwork` 使用 `getTankInfo`、模拟/实际 `drain` 与 `fill`，并通过 `FluidFilter` 匹配 `FluidStack`；
4. AE2、GT 物品仓和物品管道提供物品身份与堆叠数量，但不会替 OC 账本解释化学物种或批次质量。

这些接口是同步的物理搬运接口，没有跨重启的 exactly-once 来源收据。当前实现因此把外部端点的 `durability` 标为 `UNPROVEN`；没有可验证的来源检查点时，自动扣料请求必须拒绝或进入隔离，而不能声称“已经可靠导入”。这不是网页模拟器的限制，而是 Forge 旧接口的持久性边界。

## 5. 命令和自动调度

服务器命令与 GUI 应调用同一服务，不能各自复制一套账本逻辑：

```text
/ocfactory create ester start
/ocfactory create vitamin_a start
/ocfactory status
/ocfactory diagnose <factory UUID>
/ocfactory start <factory UUID>
```

`create ... start` 是一个单写入器事务：创建蓝图并打开运行标志，但仍不会生成原料。服务器每秒最多为一个运行中的蓝图提交一个有界调度周期；每个周期按声明的最大转移量从源仓向对应进料缓冲转移。调度器看到缺料、满缓冲、身份不符或来源端点未证明时，保留原库存并写入具体阻塞原因。

## 6. 两条产线的存储布局

### 乙酸乙酯

```text
Acetic Acid Tank ─┐
Ethanol Tank ─────┼─> 三个独立 Feed Buffer ─> Reaction Buffer
Water Tank ───────┘                         ├─> Distillate / Organic Product
                                            ├─> Aqueous Wash / Wastewater
                                            └─> Residue / Quarantine
```

产品、残余和废水不是“自动消失”的输出。分离模型尚未获得足够的 VLE/夹带水/连续相数据时，设备可以保存参考组成，但不能把它包装为 GT 标准乙酸乙酯流体。

### 维生素 A 乙酸酯

按 C5/C8/C10、C6、C14、偶联、部分加氢、乙酰化和结晶分段。每一段至少包含原料源仓、独立进料缓冲、过程缓冲、合格交接、残余/废料和不合格隔离。氢气、催化剂、酸碱、溶剂和惰性气体均为有身份的消耗品；E/Z 未定和 α/β 分支不得在仓储层重命名。

## 7. 验收顺序

自动测试已经覆盖：蓝图幂等、三相/单位隔离、缺料拒绝、缓冲满槽、过滤器拒绝、源仓—缓冲守恒、重复调度、世界账本校验和历史世界的 `storage == null` 兼容。真人验收时再做：

1. 服务器启动后执行 `/ocfactory create ester start`，记录 factory UUID；
2. 执行 `/ocfactory status`，确认节点/路线数和 `FEEDING` 阶段；
3. 用真实 GT 储罐/输入仓/管道把乙酸、乙醇、水分别接入过滤端口，确认源仓量变化而非指令刷入；
4. 用 `/ocfactory diagnose <UUID>` 记录 `fed / required`，拔管制造断线与满槽，检查原因和库存保留；
5. 关闭区块、断线、重启服务器，再重复一次相同请求，确认原收据返回且不重复扣料；
6. 完成乙酸乙酯两批后，再为维生素 A 蓝图配置分段源仓和隔离仓。真人截图应包含机器 UI、管道方向、过滤器和实际 FluidRegistry 名称。

网页拓扑在 `docs/handbook/site/storage-logistics.html`；它是教学可视化，不是服务器状态面板，也不会替真人 GT 管路验收。

## 8. 0.4.3 物理端口实现

`0.4.3-storage-port-alpha1` 新增 `StorageBlock`、`StorageTile`、`StorageWorld` 和只读 `StorageContainer/StorageGui`。`/ocfactory create <ester|vitamin_a> start` 在账本写入确认后，为该玩家在连续空位放置所有源仓、进料缓冲、过程缓冲、产品、残余、废水和尾气端口；已有方块不会被覆盖，放置失败保留蓝图并显示坐标。端口 tile 只保存节点绑定、相态/单位、身份和待确认入口，不保存第二份化学库存。

液体和气体端口实现 `IFluidHandler`。`fill` 只接受绑定身份对应的 `FluidRegistry` 对象；实际填充先将数量和确定性 request id 写入端口 NBT，`StorageWorld` 再调用 `UnitService.creditStorageSource`。服务端账本收到回执后才清除待确认值，重启期间重复调用同一 request id 只能得到 `ALREADY_COMMITTED`。固体源端口实现单槽 `IInventory`，只接受 `catalyst-core` 或显式 item registry 身份，并用相同的待确认流程入账。产品端口当前为只读账本观察面；GT 成品发放仍需质量凭证和接收端回执。

这个端口是 OC 自有的可恢复边界，不能把它推广成任意 GT 储罐的 exactly-once 证明。外部 GT `IFluidHandler` 仍保留 `UNPROVEN`，除非后续实现来源检查点、变化验证和不确定状态隔离。构建验证包括模组测试、化学自检、Spotless、网页/Wiki QA；远程升级 `0.4.3-storage-port-alpha1` 已执行零玩家检查、545 文件世界备份校验、JAR SHA256 校验和 authority 字节一致性检查，真人管道和客户端 UI 仍待手动验收。

## 9. 面向真实 GTNH 的储存站设计

为了让“建厂一次、以后自动补料”具有可玩性，储存站按相态分成三条互不混用的干线；玩家只在第一次布置时把 GTNH 储罐和管道接到对应源端口，之后由 GT 管道持续推送、OC 调度器按批次需求取用。

| 储存站 | GTNH 侧建议 | OC 侧端口 | 设计理由 |
| --- | --- | --- | --- |
| 液体原料站 | GT 大型储罐 / Super Tank、Large Steel Tank 或 EnderIO `blockTank`；每种液体独占一个罐 | `LIQUID / MB`，单一 FluidRegistry 身份 | 乙酸、乙醇（目标实例中为 `bioethanol`）和水不能共用无过滤管；罐体容量只负责缓冲，不改变 mB 的单位 |
| 气体原料站 | GT 气体储罐或气密的高压管；氢气、乙炔、甲醛分别独占管路 | `GAS / MB`，额外记录压力/温度资格 | `IFluidHandler` 只证明流体搬运，不证明压力和温度；资格不足时进入隔离而不是强行反应 |
| 固体辅料站 | GT 物品仓、AE2/物流仓或专用输入仓 | `SOLID / ITEM_STACK`，registry + meta + NBT 白名单 | 催化剂、碱、干燥芯、过滤介质按堆叠计数；不会把一件物品暗中换算成 mol |
| 产品/残余站 | GT 输出仓、废液罐、尾气收集罐和隔离仓 | `PRODUCT`、`RESIDUE`、`WASTE`、`TAIL_GAS` | 没有去向的物料会产生背压并暂停上游；副产物不能被 void 掉 |

GT 不锈钢普通流体管的本地源码登记为物品编号 5142（起始编号 5140，普通尺寸 +2）；GT 管道每次按接收方返回量扣除，EnderIO 储罐默认每次推送 100 mB。上述是源码依据，不是已经完成的真人放置验收；实际服务器仍以 NEI 注册表、管道材质耐受和右键面板为准。管道必须在每条干线设置过滤器，不能依赖“相邻就会自动选对物料”。

推荐的最小物理布局是“源仓—过滤器—相态干线—OC 源端口—独立进料缓冲—设备—产品/残余缓冲”。每种液体至少保留一个源仓和一个进料缓冲；维生素 A 的氢气、乙炔、甲醛和液体溶剂再各自复制一条干线。产品、母液、废水、尾气和不合格 E/Z 物料采用独立回收线，回收线满时只暂停相应工段，不会覆盖或删除其他库存。

## 10. 一键生成和长期运行的实际边界

`/ocfactory create ester start` 与 `/ocfactory create vitamin_a start` 已经可以一键创建并启动账本蓝图，自动放置 OC 源端口、进料缓冲和输出观察端口；一键动作不生成原料，也不会替玩家猜测外部 GT 储罐坐标。玩家第一次仍需完成一次性的储罐、过滤器、管道和输出仓布置。布置完成后，按批次运行不再需要 `/give` 或手动注入命令。

当前版本已经把“源仓 → 进料缓冲”的自动调度、身份过滤、容量背压、请求 ID 和重启重放做成服务器能力；反应釜、分离器和 GT 标准成品出口尚未被这个存储蓝图自动驱动。因而验收时应把“自动补料”与“自动完成化学反应”分开记录：前者可以由真实 GT 管道和端口完成，后者仍需后续工艺模块和真人 UI 验收通过后才开放。
