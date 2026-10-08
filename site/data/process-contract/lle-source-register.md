# NIST/TRC 公开 LLE 数据登记与独立 UNIFAC 检查

审阅日期：2026-10-04。该登记由独立 AI 物理化学审阅 agent 生成；不是实验室原始记录、真人专家签核或游戏收率验证。

## 可复现入口

```powershell
research/process-engine/.venv/Scripts/python.exe research/industrial-review/verify-lle-source.py
```

脚本读取 `research/industrial-review/sources/` 中冻结的 NIST/TRC JSON/XML，不修改 continuous_lle.py。它先把 JSON 与 XML 的数值单元格逐项交叉核对，再在每条报告相组成上调用现有四组分 UNIFAC，计算两相 `ln(xγ)` 差；没有重新拟合参数、没有从模型反推实验相组成、没有把误差转成 GT 收率。

## 数据范围和数量

|公开来源|NIST PMD|公开可解析 tie-line 数|温度|系统|压力|
|---|---:|---:|---|---|---|
|Toikka 等，DOI `10.1016/j.fluid.2014.04.013`|2、4|29（15+14）|303.15、313.15 K|乙醇/乙酸乙酯/水；乙酸/乙酸乙酯/水|101 kPa|
|Trofimova 等，DOI `10.1016/j.fluid.2019.112321`|10、12|24（11+13）|323.15、333.15 K|乙酸/乙酸乙酯/水；乙醇/乙酸乙酯/水|101 kPa|
|合计|—|**53**|303.15–333.15 K|仅三元 tie-line|101 kPa|

两篇论文标题和摘要均讨论四元乙酸/乙醇/乙酸乙酯/水体系及其子系统，但 NIST/TRC ThermoML 档案里用于本登记的 PMD 组件数是 3。**本登记严格将 53 行标为三元 tie-line；没有把四元论文标题、binodal 曲线点、临界点或纯物性记录冒充四元 tie-line。**

## 原始来源快照和哈希

|DOI|NIST JSON|SHA-256|ThermoML XML|SHA-256|Crossref|
|---|---|---|---|---|---|
|`10.1016/j.fluid.2014.04.013`|`research/industrial-review/sources/10.1016__j.fluid.2014.04.013.thermoml.json`|`e2afd9cf0b33b93f2d585ff464357c23979e1515deca356b5a4ddb866d03d1cd`|`research/industrial-review/sources/10.1016__j.fluid.2014.04.013.thermoml.xml`|`a7bb6ebef47ff5658598cdea9a928bd4411f23863a7bfc280a0d5ed92459cfd3`|`research/industrial-review/sources/10.1016__j.fluid.2014.04.013.crossref.json`|
|`10.1016/j.fluid.2019.112321`|`research/industrial-review/sources/10.1016__j.fluid.2019.112321.thermoml.json`|`c6659e540ef6ca7d942708c589529475a339b2a30a53b1a5784fb4ae5509c66d`|`research/industrial-review/sources/10.1016__j.fluid.2019.112321.thermoml.xml`|`38edd3fa538cb697eda6cfbf0153f31e055541ae50ca5bc2ae9ad05cc41fe56c`|`research/industrial-review/sources/10.1016__j.fluid.2019.112321.crossref.json`|

NIST 地址：`https://trc.nist.gov/ThermoML/<DOI>.json` 和对应 `.xml`。NIST 页面说明 JSON 是由同一档案的实验热物性／热化学数据渲染，ThermoML 由 JSON 生成；其免责声明意味着这是 TRC 的公开转录资料，不等价于出版商原始实验数据。

候选 DOI `10.1016/j.fluid.2011.09.035`、`10.1016/j.molliq.2017.01.092`、`10.1252/jcej.32.440`、`10.36953/ecj.2015.se1673` 已查询 Crossref；对应 NIST ThermoML 路径当前返回 404，因此没有把其元数据或论文标题计入实验 tie-line 数量。

## 组分映射和相组成基准

冻结 JSON 使用统一组分顺序 `[acetic-acid, ethanol, ethyl-acetate, water]`，但每条记录只填三元子集。原始档案的 `nOrgNum` 映射如下：

- 2014 档案：1=acetic acid，2=ethanol，3=ethyl acetate，4=water。
- 2020 档案：1=ethyl acetate，2=acetic acid，3=ethanol，4=water。
- 每个 PMD 的 `Variable` 给出一相的温度和一个组成变量；`Property` 给出两相其余可测组分。脚本只在恰好一个组分缺失时以摩尔分数闭合补齐 `1−Σx`，并明确这一个闭合值没有伪造独立不确定度。
- 2014 PMD2/4 和 2020 PMD10/12 的压力约束均为 101 kPa；每条输出保留档案的扩展不确定度字段（95%置信度，若该 property 字段存在）。

## 未拟合 UNIFAC 结果

- 解析 tie-line：**53**；JSON/XML 数值单元格交叉检查通过。
- 温度：303.15, 313.15, 323.15, 333.15 K；模型当前数值接受域为 298.15–380 K，因此本次四个温度都在软件数值域内。
- 以公开两相组成直接计算 `ln(xγ)`：最大绝对两相残差 **0.657444**，中位数 **0.212875**。这是模型在观测点的化学势一致性误差，不是参数拟合误差，也不是预测组成误差。
- 所有 53 条记录都有至少一个 NIST/TRC property 扩展不确定度字段；由相加闭合得到的缺失组分不确定度保持未定义。

按来源／温度分组的最大 `|Δln a|`：

|来源温度|系统|条数|最大残差|中位残差|
|---|---|---:|---:|---:|
|10.1016/j.fluid.2014.04.013 @ 303.15 K|acetic-acid/ethyl-acetate/water|6|0.634808|0.322646|
|10.1016/j.fluid.2014.04.013 @ 303.15 K|ethanol/ethyl-acetate/water|8|0.460925|0.278289|
|10.1016/j.fluid.2014.04.013 @ 313.15 K|acetic-acid/ethyl-acetate/water|8|0.205505|0.127269|
|10.1016/j.fluid.2014.04.013 @ 313.15 K|ethanol/ethyl-acetate/water|7|0.244496|0.197721|
|10.1016/j.fluid.2019.112321 @ 323.15 K|acetic-acid/ethyl-acetate/water|6|0.554601|0.260293|
|10.1016/j.fluid.2019.112321 @ 323.15 K|ethanol/ethyl-acetate/water|7|0.253018|0.190347|
|10.1016/j.fluid.2019.112321 @ 333.15 K|acetic-acid/ethyl-acetate/water|5|0.657444|0.267953|
|10.1016/j.fluid.2019.112321 @ 333.15 K|ethanol/ethyl-acetate/water|6|0.511306|0.1708|

这些是“在实验相组成上评价模型”的分组统计，不是模型回归后的误差。

残差偏大或偏小都不能直接判断哪个来源“正确”：未拟合 UNIFAC 的参数、色谱／滴定误差、子系统边界、相身份、温压一致性和三元模型与四元反应物流之间的差别都需要进一步分析。

## 验证边界和后续准入

- 这些数据覆盖三元子域，不覆盖游戏真实反应物流的四元总体；不能据此宣称四元模型已经实验验证。
- 2014/2020 文献温度高于当前离线洗涤参考 298.15 K；不能把不同温度 tie-line 直接替换进 298.15 K 参考。
- 当前校验只检查报告相组成上的 activity-coefficient 一致性；没有全局相稳定、三液相、VLLE、动力学、沉降、夹带水或装置热负荷证明。
- 如要作为分离参数准入，需要在同一温度、压力和组成范围内做三元 tie-line 组成误差统计，并取得真正四元 tie-line 或明确说明使用子系统近似。
- 任何 AI 产物候选、量化端点或 TS/IRC 结果仍只能进入审核队列，不能直接创建库存、修改游戏选择性或覆盖实测数据。


## 派生 midpoint feed 的未拟合端点挑战

另运行 `research/lle-validation/compare-endpoints.py`，结果冻结在 `research/industrial-review/endpoint-comparison.json`。每条实测 tie-line 的两相组成按 0.5/0.5 求平均，构造总量 1 mol 的**数值测试进料**，不给求解器实测相作为初值，也不拟合参数。这个 midpoint 不是论文报告的进料或相量。

- 53 条记录均获得数值两相候选；没有把失败条目从分母隐藏。
- 有 4 条跨子系统表重复的二元端点记录，单独列出；唯一端点对 49。
- 对所有接受两相记录，端点组成 RMSE = **0.05961058 mole fraction**；最大单组分绝对端点误差 = **0.33507792**。

这些误差说明当前未拟合原始 UNIFAC 仍有实质偏差；它不是已经验证通过的工业分离模型。上述组成误差与前节 `ln(xγ)` 驻点残差是不同指标，不能混称。重复边界记录与不确定度缺失意味着不能直接作独立同分布统计推断，需按来源、温度及组分分层解释。
