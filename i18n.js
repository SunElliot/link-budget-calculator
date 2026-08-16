/* SatTools EN/中文 language switch.
   Walks static text nodes and swaps any whose English text is in DICT.
   Units/abbreviations (dB, dBi, GHz, EIRP, QPSK…) are intentionally left as symbols.
   Long SEO articles, footers and dynamically-generated results stay English. */
(function(){
  const DICT = {
    // ---- page titles (h1) ----
    "🛰️ Satellite Link Budget Calculator":"🛰️ 卫星链路预算计算器",
    "📡 LEO Satellite Doppler Shift Calculator":"📡 LEO 卫星多普勒频移计算器",
    "🛰️ Satellite Pass Predictor (TLE)":"🛰️ 卫星过顶预测(TLE)",
    "📶 Parabolic Antenna Gain & Beamwidth Calculator":"📶 抛物面天线增益与波束宽度计算器",
    "📐 G/T Figure-of-Merit Calculator":"📐 G/T 品质因数计算器",
    "🌧️ Rain Attenuation Calculator":"🌧️ 雨衰计算器",
    "🌫️ Atmospheric Gaseous Attenuation":"🌫️ 大气气体衰减",
    "📉 BER vs Eb/N₀ Curves":"📉 误码率 BER vs Eb/N₀ 曲线",
    "📻 Satellite Frequency Band Reference":"📻 卫星频段速查",
    // ---- subtitles (header p) ----
    "LEO / Smallsat & ground-station link analysis — EIRP, FSPL, G/T, C/N₀, Eb/N₀ & margin":"LEO / 小卫星与地面站链路分析 — EIRP、FSPL、G/T、C/N₀、Eb/N₀ 与余量",
    "Orbital velocity · max Doppler shift · Doppler rate · pass curve":"轨道速度 · 最大多普勒频移 · 多普勒变化率 · 过境曲线",
    "Upcoming visible passes from a TLE & your ground station — AOS, LOS, max elevation, duration":"由 TLE 与地面站预测未来可见过境 — AOS、LOS、最大仰角、时长",
    "Gain (dBi) · half-power beamwidth · effective aperture · far-field distance":"增益(dBi)· 半功率波束宽度 · 有效口径 · 远场距离",
    "Build system noise temperature from antenna, feed, LNA & receiver → G/T in dB/K":"由天线、馈线、LNA 与接收机叠加系统噪温 → 得到 G/T(dB/K)",
    "ITU-R P.838 specific attenuation + P.618 slant-path rain fade vs availability":"ITU-R P.838 比衰减 + P.618 斜路径雨衰 vs 可用度",
    "ITU-R P.676 clear-air loss — oxygen + water vapour, specific / zenith / slant path":"ITU-R P.676 晴空衰减 — 氧气 + 水汽,比衰减 / 天顶 / 斜路径",
    "Bit error rate for BPSK · QPSK · M-PSK · M-QAM · FSK · DBPSK over AWGN":"AWGN 信道下 BPSK · QPSK · M-PSK · M-QAM · FSK · DBPSK 的误码率",
    "IEEE band designations, frequency ranges & typical satellite uses":"IEEE 波段划分、频率范围与典型卫星用途",
    // ---- card / section titles ----
    "Transmitter":"发射机","Propagation Path":"传播路径","Receiver":"接收机",
    "Data Link / Modem":"数据链路 / 调制解调","Results":"结果",
    "Link Margin vs Elevation Angle":"链路余量 vs 仰角","Inputs":"输入","Orbit":"轨道",
    "Doppler Results":"多普勒结果","Doppler Shift vs Time (overhead pass)":"多普勒频移 vs 时间(过顶)",
    "Two-Line Element (TLE)":"两行根数(TLE)","Ground Station":"地面站","Upcoming Passes":"未来过境",
    "Feed / Line before LNA":"LNA 之前的馈线 / 线损","LNA & Receiver":"LNA 与接收机",
    "Antenna":"天线","Link & Site":"链路与站点","Link":"链路","Rain":"降雨","Surface Atmosphere":"地面大气",
    "Controls":"控制","BER Curves":"BER 曲线","Required Eb/N₀ @ target BER":"目标 BER 下所需 Eb/N₀",
    "IEEE Radio & Radar Band Designations":"IEEE 无线电与雷达波段划分",
    "Common Satellite Up/Downlink Pairs":"常见卫星上/下行配对","📖 How to use":"📖 使用说明",
    // ---- article headings ----
    "What is a satellite link budget?":"什么是链路预算?",
    "The equations used by this calculator":"本计算器使用的公式",
    "Typical LEO smallsat values":"典型 LEO 小卫星取值",
    "How Doppler shift works for satellites":"卫星多普勒频移原理",
    "Formulas used":"使用的公式","How satellite pass prediction works":"卫星过顶预测原理",
    "Parabolic antenna equations":"抛物面天线公式","What is G/T?":"什么是 G/T?",
    "About this rain attenuation model":"关于本雨衰模型",
    "About gaseous (clear-air) attenuation":"关于气体(晴空)衰减",
    "What it computes":"计算内容","Reading a BER curve":"如何看 BER 曲线",
    "Formulas (AWGN, uncoded)":"公式(AWGN,未编码)","Choosing a satellite frequency band":"如何选择卫星频段",
    // ---- input labels ----
    "Transmit power":"发射功率","Tx antenna gain":"发射天线增益","Tx line / feeder loss":"发射馈线损耗",
    "Frequency":"频率","Slant range / distance":"斜距 / 距离","Atmospheric loss":"大气损耗",
    "Rain loss":"雨衰损耗","Polarization loss":"极化损耗","Pointing loss":"指向损耗",
    "Rx antenna gain":"接收天线增益","System noise temperature":"系统噪声温度",
    "Rx line loss before LNA":"LNA 前接收线损","Data rate":"数据率","Modulation / coding":"调制 / 编码",
    "Required Eb/N₀":"所需 Eb/N₀","Roll-off factor (α)":"滚降系数 (α)","Implementation loss":"实现损耗",
    "Carrier frequency":"载波频率","Orbit altitude":"轨道高度","Elevation angle":"仰角",
    "Dish diameter":"天线口径","Aperture efficiency":"口面效率","Antenna gain":"天线增益",
    "Antenna noise temp T_A":"天线噪声温度 T_A","Feed loss":"馈线损耗","Physical temperature":"物理温度",
    "LNA noise figure":"LNA 噪声系数","LNA gain":"LNA 增益","Post-LNA receiver NF":"LNA 后接收机噪声系数",
    "Polarization":"极化","Station latitude":"站点纬度","Station height":"站点海拔",
    "Rain rate R₀.₀₁":"降雨率 R₀.₀₁","Rain height h_R":"雨高 h_R","Target availability":"目标可用度",
    "Pressure":"气压","Temperature":"温度","Water-vapour density":"水汽密度",
    "Latitude":"纬度","Longitude":"经度","Altitude":"海拔","Min elevation":"最低仰角",
    "Window":"时间窗","Target BER":"目标 BER","Max Eb/N₀":"最大 Eb/N₀",
    // ---- result metric labels ----
    "Free space path loss":"自由空间路径损耗","Total path loss":"总路径损耗",
    "Eb/N₀ (received)":"Eb/N₀(接收)","Spectral efficiency":"频谱效率","Occupied bandwidth":"占用带宽",
    "C/N (received)":"C/N(接收)","C/N (required)":"C/N(所需)",
    "Orbital velocity":"轨道速度","Orbital period":"轨道周期","Max pass duration":"最长过境时长",
    "Max Doppler shift":"最大多普勒频移","Peak Doppler rate (zenith)":"峰值多普勒变化率(天顶)",
    "Doppler @ elevation":"该仰角多普勒","Total Doppler span":"多普勒总跨度",
    "Half-power beamwidth":"半功率波束宽度","Wavelength":"波长","Effective aperture":"有效口径",
    "Far-field distance":"远场距离","First-null beamwidth":"第一零点波束宽度",
    "LNA noise temp":"LNA 噪声温度","Effective Rx noise temp":"等效接收噪温",
    "System noise temp T_sys":"系统噪温 T_sys","Specific attenuation γ_R":"比衰减 γ_R",
    "Effective path length":"有效路径长度","Attenuation A₀.₀₁":"衰减 A₀.₀₁",
    "Rain fade @ target":"目标雨衰","Outage time / year":"年中断时长",
    "Oxygen γ_o":"氧气 γ_o","Water-vapour γ_w":"水汽 γ_w","Total specific γ":"总比衰减 γ",
    "Zenith attenuation":"天顶衰减","Slant-path @ elevation":"该仰角斜路径",
    // ---- preset buttons ----
    // ---- link budget new UI ----
    "Single Link":"单链路",
    "TT&C Analysis":"测控分析",
    "↓ Export PDF":"↓ 导出 PDF",
    "Orbit / Elevation":"轨道 / 仰角",
    "↑ TC Uplink (Ground → Satellite)":"↑ TC 上行（地面 → 卫星）",
    "↓ TM Downlink (Satellite → Ground)":"↓ TM 下行（卫星 → 地面）",
    "Ground Transmitter":"地面发射机",
    "TC Path + Satellite Receiver":"TC 路径 + 卫星接收机",
    "TC Modem":"TC 调制解调器",
    "Satellite Transmitter":"卫星发射机",
    "TM Path + Ground Receiver":"TM 路径 + 地面接收机",
    "TM Modem":"TM 调制解调器",
    // ---- TT&C carrier / coding / ranging (2026-07) ----
    "TC Modem & Carrier":"TC 调制解调与载波",
    "TM Modem & Carrier":"TM 调制解调与载波",
    "Modulation scheme":"调制体制",
    "Data mod index":"数据调制指数",
    // label markup is "Carrier loop bandwidth B<sub>L</sub>" — the walker
    // sees the text node up to (and including) the trailing "B"
    "Carrier loop bandwidth B":"载波环带宽 B",
    "Coding":"信道编码",
    "Ranging channel":"测距信道",
    "Ranging mod index":"测距调制指数",
    "Required Pr/N₀":"所需 Pr/N₀",
    "TM frequency source":"TM 频率来源",
    "residual carrier splits power":"残留载波按调制指数分配功率",
    "rad peak, e.g. 0.8–1.4":"rad(峰值),如 0.8–1.4",
    "Hz, one-sided":"Hz,单边环路带宽",
    "sine major tone on carrier":"载波上的正弦主音",
    "turnaround tone on TM carrier":"TM 载波上的转发测距音",
    "rad peak, e.g. 0.4–0.8":"rad(峰值),如 0.4–0.8",
    "dB-Hz, per integration time":"dB-Hz,取决于积分时间",
    "coherent = from TC × turnaround ratio":"相干 = TC 频率 × 转发比",
    "Suppressed carrier (BPSK/QPSK)":"抑制载波(BPSK/QPSK)",
    "PCM/PM (NRZ on carrier)":"PCM/PM(NRZ 直接调相)",
    "PCM/PSK/PM square subcarrier":"PCM/PSK/PM 方波副载波",
    "PCM/PSK/PM sine subcarrier":"PCM/PSK/PM 正弦副载波",
    "Independent (set below)":"独立设置(在下方填写)",
    "Coherent ×240/221 (S/S)":"相干转发 ×240/221(S/S)",
    "Coherent ×880/749 (X/X)":"相干转发 ×880/749(X/X)",
    "Uncoded PCM (BER 1e-5)":"未编码 PCM(BER 1e-5)",
    "CCSDS BCH(63,56) SEC":"CCSDS BCH(63,56) 纠单错",
    "CCSDS LDPC(128,64) TC":"CCSDS LDPC(128,64) 遥控",
    "Conv K=7 R=1/2":"卷积码 K=7 R=1/2",
    "Conv + RS(255,223)":"卷积码 + RS(255,223)",
    "Off":"关","On":"开",
    "Carrier Pc/N₀":"载波 Pc/N₀",
    "Loop SNR (2B_L)":"载波环 SNR(2B_L)",
    "Ranging Pr/N₀":"测距 Pr/N₀",
    // ---- pass predictor orbital-elements input (2026-07) ----
    "Orbit — TLE / Elements":"轨道 — TLE / 六根数",
    "Paste TLE":"粘贴 TLE",
    "Orbital elements":"六根数",
    "Epoch (UTC)":"历元(UTC)",
    "element set reference time":"根数的参考时刻",
    "Semi-major axis a":"半长轴 a",
    "km — 6371 + altitude":"km — 6371 + 轨道高度",
    "Eccentricity e":"偏心率 e",
    "Inclination i":"轨道倾角 i",
    "RAAN Ω":"升交点赤经 Ω",
    "Argument of perigee ω":"近地点幅角 ω",
    "Mean anomaly M":"平近点角 M",
    // ---- rain sky-noise coupling (2026-07) ----
    "Rain sky-noise coupling":"雨致天空噪声耦合",
    "rain/atm loss also heats the sky":"雨/大气损耗同时加热天空",
    "absorptive loss heats the sky":"吸收性损耗加热天空",
    "On (Rx under rain — downlink)":"开(接收端在雨区——下行)",
    "On (ground Rx under rain)":"开(地面接收站在雨区)",
    "Medium temperature T_m":"介质温度 T_m",
    "K, ITU typ. 275":"K,ITU 典型值 275",
    "Absorptive loss part":"吸收性损耗部分",
    "dB of add. losses that absorb (rain+gas)":"dB,附加损耗中的吸收部分(雨+大气)",
    "clear-sky, K":"晴空值,K","clear-sky K, at the antenna aperture":"晴空值 K,参考天线口面","K, at the antenna aperture":"K,参考天线口面","dB — already inside T_sys, not subtracted again":"dB —— 已计入 T_sys,不再二次扣除","dB — already inside T_sys":"dB —— 已计入 T_sys",
    "clear-sky Tsys above":"上方为晴空 Tsys",
    "clear-sky K, at the antenna aperture (incl. sky, feed, LNA)":"晴空值 K,参考天线口面(含天空、馈线、LNA)",
    "Sky-noise rise ΔT":"天空噪声抬升 ΔT",
    // ---- reverse solver (2026-07) ----
    "Reverse Solver":"反算求解",
    "Solve for":"求解变量",
    "Target margin":"目标余量",
    "Max data rate":"最大数据率",
    "Min transmit power":"最小发射功率",
    "Min Tx antenna gain":"最小发射天线增益",
    "Min Rx antenna gain":"最小接收天线增益",
    "Max slant range":"最大斜距",
    "Max TC data rate":"最大 TC 数据率",
    "Min ground Tx power":"最小地面发射功率",
    "Max TM data rate":"最大 TM 数据率",
    "Min satellite Tx power":"最小卫星发射功率",
    // ---- interference / C/(N+I) (2026-07) ----
    "Interference (optional)":"干扰(可选)",
    "Adjacent-satellite C/I":"邻星干扰 C/I",
    "Cross-pol C/I":"交叉极化 C/I",
    "HPA intermod C/I₃":"HPA 互调 C/I₃",
    "Aggregate C/I":"合计 C/I",
    "dB, 0 or blank = ignore":"dB,0 或留空 = 忽略",
    // pre-existing TT&C strings that were missing from DICT
    "Rx line loss":"接收线损",
    "deg — working elevation":"度 — 工作仰角",
    "dB (atm+rain+pol+pointing)":"dB(大气+雨+极化+指向)",
    "📖 How to use (TT&C)":"📖 使用说明(测控)",
    "TC Uplink Results":"TC 上行结果",
    "TM Downlink Results":"TM 下行结果",
    "TT&C Summary":"测控链路汇总",
    "Pass Data Budget":"过境数据预算",
    "Min working elevation":"最低工作仰角",
    "Contact time / pass":"过境时长 / 次",
    "Data per pass":"每次过境数据量",
    "Time to download 1 GB":"下传 1 GB 所需",
    "Passes to download 1 GB":"下传 1 GB 所需过境次数",
    "LEO S-band TT&C":"LEO S 波段测控",
    "CubeSat UHF TT&C":"立方星 UHF 测控",
    "LEO X/S Mixed":"LEO X/S 混合",
    "Additional losses":"附加损耗",
    "Sat Rx antenna gain":"卫星接收天线增益",
    "Sat noise temperature":"卫星系统噪温",
    "Ground Rx antenna gain":"地面接收天线增益",
    "Ground noise temperature":"地面系统噪温",
    "TC data rate":"TC 数据率",
    "TM data rate":"TM 数据率",
    "Tx line loss":"发射线损",
    "TC frequency":"TC 频率",
    "TM frequency":"TM 频率",
    "Working elevation":"工作仰角",
    "Link Margin vs Elevation — TC (green) & TM (blue)":"余量-仰角曲线 — TC（绿）与 TM（蓝）",
    "How to use (TT&C)":"使用说明（测控）",
    "How to use":"使用说明",
    // ---- LEO S-band downlink":"LEO S 波段下行 ----
    "LEO S-band downlink":"LEO S 波段下行","CubeSat UHF":"立方星 UHF","LEO X-band payload":"LEO X 波段载荷",
    "GEO Ku-band":"GEO Ku 波段","CubeSat UHF 437 MHz":"立方星 UHF 437 MHz","S-band 2.2 GHz":"S 波段 2.2 GHz",
    "X-band 8.2 GHz":"X 波段 8.2 GHz","3 m S-band station":"3 m S 波段站","4.5 m X-band":"4.5 m X 波段",
    "1.2 m Ka-band":"1.2 m Ka 波段","3 m S-band, good LNA":"3 m S 波段(优质 LNA)",
    "CubeSat UHF Rx":"立方星 UHF 接收","Standard (15°C, 7.5 g/m³)":"标准(15°C,7.5 g/m³)",
    "Tropical humid":"热带潮湿","Cold & dry":"寒冷干燥","High-altitude site":"高海拔站点",
    "Predict passes":"预测过境","📍 Detect":"📍 定位","Use my location:":"使用我的位置:",
    // ---- table headers ----
    "Band":"波段","Typical satellite use":"典型卫星用途","Service":"业务","Uplink":"上行","Downlink":"下行",
    "AOS (local · az)":"AOS(本地 · 方位)","Max elev (time · az)":"最大仰角(时刻 · 方位)","LOS (local · az)":"LOS(本地 · 方位)",
    "Duration":"时长","Availability":"可用度","Outage % (p)":"中断 %(p)","Modulation":"调制","bits/sym":"比特/符号",
    // ---- select options ----
    "Circular":"圆极化","Horizontal":"水平极化","Vertical":"垂直极化","Custom (set Eb/N₀ below)":"自定义(在下方填 Eb/N₀)",
    // ---- summaries ----
    "Show full calculation breakdown":"显示完整计算明细","Show noise temperature breakdown":"显示噪温明细",
    "Equivalent heights & breakdown":"等效高度与明细","Rain fade vs link availability":"雨衰 vs 链路可用度",
    // ---- hints ----
    "RF output power":"射频输出功率","auto-sets required Eb/N₀":"自动设置所需 Eb/N₀",
    "dB, for target BER incl. FEC":"dB,目标 BER(含 FEC)","filter excess bandwidth, e.g. 0.20–0.35":"滤波器多余带宽,如 0.20–0.35",
    "Kelvin (incl. LNA, sky, feed)":"开尔文(含 LNA、天空、馈线)","km — sets slant range vs elevation":"km — 决定斜距随仰角变化",
    "km (circular orbit)":"km(圆轨道)","deg — for instantaneous values":"度 — 用于瞬时值",
    "0–1, typ. 0.55–0.65":"0–1,常取 0.55–0.65","dBi (see Antenna Gain tool)":"dBi(见天线增益工具)",
    "K — sky + ground pickup":"K — 天空 + 地面拾取","dB (waveguide/connectors before LNA)":"dB(LNA 前波导/接头)",
    "K (ambient, typ. 290)":"K(环境,常取 290)","dB (rest of chain)":"dB(后级链路)",
    "GHz (1–55)":"GHz(1–55)","deg (≥5°)":"度(≥5°)",
    "mm/h exceeded 0.01% of year (ITU-R P.837)":"mm/h,一年中 0.01% 时间超过(ITU-R P.837)",
    "km (≈ 0°C isotherm + 0.36)":"km(≈ 0°C 等温线 + 0.36)","% of year link must be up":"链路需正常的年时间百分比",
    "GHz (1–54)":"GHz(1–54)","hPa (total, ≈1013 at sea level)":"hPa(总压,海平面 ≈1013)",
    "g/m³ (ITU reference = 7.5)":"g/m³(ITU 参考值 = 7.5)","draws a reference line":"画一条参考线",
    "dB, x-axis range":"dB,横轴范围","°N positive, °S negative":"北纬为正,南纬为负",
    "°E positive, °W negative":"东经为正,西经为负","metres above sea level":"米(海拔)",
    "km above sea level":"km(海拔)","deg (abs value used)":"度(取绝对值)",
    "deg — horizon mask":"度 — 地平遮挡","hours ahead":"向后小时数","metres":"米",
    // ---- hub home ----
    "EIRP, FSPL, G/T, C/N₀, Eb/N₀, margin & MODCOD with a margin-vs-elevation chart.":"EIRP、FSPL、G/T、C/N₀、Eb/N₀、余量与 MODCOD,含余量-仰角曲线。",
    "Orbital velocity, maximum Doppler shift, Doppler rate and a pass curve over time.":"轨道速度、最大多普勒频移、多普勒变化率和随时间的过境曲线。",
    "Paste a TLE and your coordinates to get upcoming passes: AOS, LOS, max elevation, duration.":"粘贴 TLE 与坐标,得到未来过境:AOS、LOS、最大仰角、时长。",
    "Parabolic dish gain, half-power beamwidth, effective aperture and far-field distance.":"抛物面增益、半功率波束宽度、有效口径与远场距离。",
    "Build system noise temperature from antenna, feed, LNA & receiver → G/T in dB/K.":"由天线、馈线、LNA 与接收机叠加系统噪温 → 得到 G/T(dB/K)。",
    "ITU-R P.838 + P.618 rain attenuation and slant-path fade vs link availability.":"ITU-R P.838 + P.618 雨衰与斜路径衰减 vs 链路可用度。",
    "ITU-R P.676 clear-air loss from oxygen & water vapour, zenith and slant path.":"ITU-R P.676 氧气与水汽晴空衰减,天顶与斜路径。",
    "Bit error rate vs Eb/N₀ for BPSK, QPSK, M-PSK, M-QAM, FSK and DBPSK over AWGN.":"AWGN 下 BPSK、QPSK、M-PSK、M-QAM、FSK、DBPSK 的误码率 vs Eb/N₀。",
    "VHF–W band reference with IEEE designations and satellite up/downlink pairs.":"VHF–W 波段速查,含 IEEE 划分与卫星上/下行配对。",
    // ---- gallery home (cards, categories, head) ----
    "Satellite Communication Tools":"卫星通信工具",
    "Free browser-based calculators for LEO smallsat and ground-station link design — no signup, no analytics.":"面向 LEO 小卫星与地面站链路设计的免费在线计算器 — 免注册,无分析追踪。",
    "Categories":"分类","All tools":"全部工具","← All tools":"← 全部工具","Link Analysis":"链路分析",
    "Orbit & Tracking":"轨道与跟踪","Hardware":"硬件","Reference":"参考",
    "Link Budget":"链路预算","Doppler Shift":"多普勒频移","Pass Predictor":"过顶预测",
    "Antenna Gain":"天线增益","G/T Figure of Merit":"G/T 品质因数","Rain Fade":"雨衰",
    "Gaseous Attenuation":"气体衰减","Frequency Bands":"频段速查",
    "No tools match your search.":"没有匹配的工具。",
    // ---- footers ----
    "SatTools · Free satellite communication calculators · LEO / smallsat / ground station · runs entirely in your browser.":"SatTools · 免费卫星通信计算器 · LEO / 小卫星 / 地面站 · 完全在浏览器中运行。",
    "Free satellite link budget calculator · TT&C uplink/downlink analysis · PDF export · runs entirely in your browser.":"免费卫星链路预算计算器 · 测控上/下行分析 · PDF 导出 · 完全在浏览器中运行。",
    "Free LEO Doppler shift calculator · orbital velocity, max Doppler, Doppler rate, pass curve · runs entirely in your browser.":"免费 LEO 多普勒频移计算器 · 轨道速度、最大多普勒、多普勒变化率、过境曲线 · 完全在浏览器中运行。",
    "Free TLE satellite pass predictor · SGP4 via satellite.js · runs entirely in your browser.":"免费 TLE 卫星过顶预测 · 基于 satellite.js 的 SGP4 · 完全在浏览器中运行。",
    "Free parabolic antenna calculator · gain, beamwidth, aperture, far-field · runs entirely in your browser.":"免费抛物面天线计算器 · 增益、波束宽度、口径、远场 · 完全在浏览器中运行。",
    "Free G/T figure-of-merit calculator · system noise temperature cascade · runs entirely in your browser.":"免费 G/T 品质因数计算器 · 系统噪温级联 · 完全在浏览器中运行。",
    "Free rain attenuation calculator · ITU-R P.838 + P.618 · specific attenuation & slant-path fade · runs in your browser.":"免费雨衰计算器 · ITU-R P.838 + P.618 · 比衰减与斜路径衰减 · 在浏览器中运行。",
    "Free atmospheric gaseous attenuation calculator · ITU-R P.676 · oxygen + water vapour · runs in your browser.":"免费大气气体衰减计算器 · ITU-R P.676 · 氧气 + 水汽 · 在浏览器中运行。",
    "Free BER vs Eb/N₀ curve plotter · BPSK/QPSK/PSK/QAM/FSK over AWGN · runs entirely in your browser.":"免费 BER vs Eb/N₀ 曲线绘制 · AWGN 下 BPSK/QPSK/PSK/QAM/FSK · 完全在浏览器中运行。",
    "Satellite frequency band reference · VHF to W-band · IEEE designations & typical uses.":"卫星频段速查 · VHF 到 W 波段 · IEEE 划分与典型用途。",
    // ---- misc static ----
    "Show modulations:":"显示调制方式:",
    "Example above is the ISS — replace with a current TLE for accurate results.":"上方示例为空间站(ISS)——请替换为最新 TLE 以获得准确结果。",
    "Loading orbit library…":"正在加载轨道库…",
    // ---- phased array ----
    // ---- noise figure chain ----
    "🔗 Cascaded Noise Figure Calculator":"🔗 级联噪声系数计算器",
    "Friis cascade — NF, noise temperature & gain through an RF chain":"Friis 级联 — RF 链路的噪声系数、噪声温度与增益",
    "RF Chain Stages":"射频链路各级",
    "Noise Figure Chain":"噪声系数级联",
    "Cascaded NF":"级联噪声系数",
    "System noise temp T":"系统噪温 T","Receiver noise temp T":"接收链路噪温 T","K — sky seen by the antenna; leave 0 for receiver-only T_e":"K —— 天线看到的天空噪温;只要接收链路 T_e 时填 0",
    "Total chain gain":"链路总增益",
    "Stages":"级数",
    "Show per-stage noise breakdown":"显示各级噪声贡献明细",
    "Stage":"级名",
    "Type":"类型",
    "+ Add stage":"+ 添加级",
    "NF / Loss (dB)":"NF / 损耗 (dB)",
    "NF / Loss":"NF / 损耗",
    "Gain (dB)":"增益 (dB)",
    "Gain":"增益",
    "Device T":"器件噪温 T",
    "Contribution":"贡献",
    "Cum. NF":"累积 NF",
    "Ground Stn S-band":"地面站 S 波段",
    "CubeSat UHF Rx":"立方星 UHF 接收",
    "Ka-band VSAT Rx":"Ka 波段 VSAT 接收",
    "Amplifier":"放大器",
    "Loss / Filter":"损耗 / 滤波器",
    "Remove stage":"删除级",
    "What is cascaded noise figure?":"什么是级联噪声系数?",
    "Why the first stage dominates":"为什么第一级最重要",
    "Loss at non-ambient temperature":"非常温下的损耗",
    "Friis cascade: NF, noise temperature & per-stage contribution for any RF receiver chain.":"Friis 级联:计算任意 RF 接收链的 NF、噪温与各级贡献。",
    "Free cascaded noise figure calculator · Friis formula · RF chain noise temperature breakdown · runs entirely in your browser.":"免费级联噪声系数计算器 · Friis 公式 · RF 链路噪温明细 · 完全在浏览器中运行。",
    // ---- phased array ----
    "📡 Phased Array Antenna Gain":"📡 相控阵天线增益",
    "Array gain · scan loss · beamwidth · grating-lobe limit":"阵列增益 · 扫描损耗 · 波束宽度 · 栅瓣极限",
    "Array Geometry":"阵列几何",
    "Element & Scan":"阵元与扫描",
    "Elements X (N_x)":"X 向阵元 (N_x)",
    "Elements Y (N_y)":"Y 向阵元 (N_y)",
    "Element spacing X":"X 向阵元间距",
    "Element spacing Y":"Y 向阵元间距",
    "Element gain":"阵元增益",
    "Scan angle":"扫描角",
    "Taper / efficiency loss":"加权 / 效率损耗",
    "Total elements":"阵元总数",
    "Broadside gain":"法向增益",
    "Scan loss":"扫描损耗",
    "Gain @ scan":"扫描角增益",
    "Beamwidth X @ scan":"X 波束宽度(扫描)",
    "Beamwidth Y @ scan":"Y 波束宽度(扫描)",
    "Aperture size":"口径尺寸",
    "Grating-lobe-free scan limit":"无栅瓣扫描极限",
    "columns":"列",
    "rows (1 = linear array)":"行(1 = 线阵)",
    "λ (e.g. 0.5)":"λ(如 0.5)",
    "dBi (single element)":"dBi(单个阵元)",
    "deg from broadside":"距法向角度",
    "dB (amplitude taper, losses)":"dB(幅度加权、损耗)",
    "8×8 patch, λ/2":"8×8 贴片, λ/2",
    "16×16 Ka-band":"16×16 Ka 波段",
    "Linear 32, scan 45°":"线阵 32,扫描 45°",
    "32×32 (1024 elem)":"32×32(1024 阵元)",
    "Phased Array Gain":"相控阵增益",
    "Array gain, scan loss, beamwidth, aperture and grating-lobe-free scan limit.":"阵列增益、扫描损耗、波束宽度、口径与无栅瓣扫描极限。",
    "Free phased array gain calculator · array gain, scan loss, beamwidth, grating lobes · runs in your browser.":"免费相控阵增益计算器 · 阵列增益、扫描损耗、波束宽度、栅瓣 · 在浏览器中运行。",
    // ---- bands table ----
    "CubeSat TT&C, APRS, weather sat (137 MHz APT), beacons":"立方星 TT&C、APRS、气象卫星(137 MHz APT)、信标",
    "CubeSat up/downlink (435–438 MHz amateur), TT&C, IoT":"立方星上/下行(435–438 MHz 业余)、TT&C、物联网",
    "GNSS (GPS/Galileo), Iridium, Inmarsat, mobile sat phones":"GNSS(GPS/伽利略)、铱星、Inmarsat、卫星电话",
    "LEO TT&C & downlink, ISS, weather, some payloads (2.0–2.3 GHz)":"LEO TT&C 与下行、空间站、气象、部分载荷(2.0–2.3 GHz)",
    "GEO comms (rain-robust), VSAT, TV distribution":"GEO 通信(抗雨)、VSAT、电视分发",
    "EO payload downlink (8–8.4 GHz), military & deep-space, radar":"对地观测载荷下行(8–8.4 GHz)、军用与深空、雷达",
    "DTH TV, VSAT, broadband (Starlink user 10.7–12.7 GHz)":"直播卫星电视、VSAT、宽带(Starlink 用户 10.7–12.7 GHz)",
    "High-throughput sat (HTS), inter-satellite links":"高通量卫星(HTS)、星间链路",
    "HTS broadband, Starlink/OneWeb gateways, high data rate":"HTS 宽带、Starlink/OneWeb 信关站、高数据率",
    "Next-gen HTS, inter-satellite links, feeder links":"下一代 HTS、星间链路、馈电链路",
    "Experimental, ISL, automotive radar (terrestrial)":"实验、星间链路、车载雷达(地面)",
    "C-band FSS":"C 波段 FSS",
    "X-band (gov/EO)":"X 波段(政府/对地观测)",
    "Ku-band FSS":"Ku 波段 FSS",
    "Ka-band":"Ka 波段",
    "Amateur UHF/VHF":"业余 UHF/VHF",
    "Wavelength":"波长",
    "Frequency":"频率",
    // ---- HPA backoff ----
    "⚡ Transponder Saturation & HPA Backoff Calculator":"⚡ 转发器饱和与功率回退(HPA 回退)计算器",
    "TWTA / SSPA saturation curve — IBO/OBO conversion, gain compression & multicarrier intermodulation":"TWTA / SSPA 饱和曲线 — IBO/OBO 换算、增益压缩与多载波互调",
    "HPA Backoff":"HPA 回退",
    "CubeSat UHF SSPA":"立方星 UHF SSPA",
    "VSAT SSPA (4 carriers)":"VSAT SSPA(4 载波)",
    "GEO TWTA Transponder":"GEO TWTA 转发器",
    "Operating Point":"工作点",
    "Saturation Curve (AM/AM)":"饱和曲线(AM/AM)",
    "Amplifier type":"放大器类型",
    "AM/AM model used":"所用 AM/AM 模型",
    "TWTA (Saleh model)":"TWTA(Saleh 模型)",
    "SSPA (Rapp model)":"SSPA(Rapp 模型)",
    "Smoothness factor p":"平滑因子 p",
    "Rapp knee — 2≈smooth, 8+≈hard limiter":"Rapp 膝点 — 2≈平滑,8+≈接近硬限幅",
    "Saturated output power":"饱和输出功率",
    "Psat, single-carrier rating":"Psat,单载波额定值",
    "Small-signal gain G₀":"小信号增益 G₀",
    "dB — used only to report drive power":"dB——仅用于计算驱动功率",
    "Set by":"设定方式",
    "which backoff you are driving":"你要设定的回退类型",
    "Input Backoff (IBO)":"输入回退(IBO)",
    "Output Backoff (OBO)":"输出回退(OBO)",
    "Backoff value":"回退值",
    "dB below saturation, composite/total":"dB,相对饱和点,合成/总值",
    "Carriers (FDMA)":"载波数(FDMA)",
    "equal-power carriers sharing this HPA":"共用该 HPA 的等功率载波数",
    "Reference C/I₃":"参考 C/I₃",
    "dB, two-tone, at the OBO below":"dB,双音,对应下方 OBO",
    "…at reference OBO":"对应参考 OBO",
    "Gain compression":"增益压缩",
    "Total output power":"总输出功率",
    "Per-carrier output power":"单载波输出功率",
    "Estimated C/I₃":"估算 C/I₃",
    "Show full breakdown":"显示完整明细",
    "Free HPA backoff calculator · TWTA (Saleh) / SSPA (Rapp) saturation curve · IBO/OBO, gain compression & C/I₃ · runs entirely in your browser.":"免费 HPA 回退计算器 · TWTA(Saleh)/ SSPA(Rapp)饱和曲线 · IBO/OBO、增益压缩与 C/I₃ · 完全在浏览器中运行。",
    "TWTA & SSPA saturation curve: IBO/OBO conversion, gain compression and multicarrier C/I₃.":"TWTA 与 SSPA 饱和曲线:IBO/OBO 换算、增益压缩与多载波 C/I₃。"
  };

  let nodes = [];
  function capture(){
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        if(!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentNode;
        const t = p && p.nodeName;
        if(t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if(p && p.closest && p.closest('.topnav')) return NodeFilter.FILTER_REJECT; // keep nav as-is
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n; while((n = w.nextNode())) nodes.push({ node:n, en:n.nodeValue });
  }
  // dynamic-content helpers used by each calculator's JS
  window.SATLANG = 'en';
  window.t = function(en, zh){ return (window.SATLANG === 'zh' && zh != null) ? zh : en; };
  const langCbs = [];
  window.onLang = function(cb){ langCbs.push(cb); };

  function applyLang(lang){
    window.SATLANG = (lang === 'zh') ? 'zh' : 'en';
    nodes.forEach(({node,en})=>{
      const key = en.trim();
      node.nodeValue = (lang === 'zh' && DICT[key]) ? en.replace(key, DICT[key]) : en;
    });
    // markup blocks via data-en / data-zh (innerHTML swap)
    document.querySelectorAll('[data-en]').forEach(el=>{
      const html = (lang === 'zh' && el.dataset.zh != null) ? el.dataset.zh : el.dataset.en;
      if(html != null) el.innerHTML = html;
    });
    // input placeholders
    document.querySelectorAll('[data-ph-en]').forEach(el=>{
      el.placeholder = (lang === 'zh' && el.dataset.phZh != null) ? el.dataset.phZh : el.dataset.phEn;
    });
    document.documentElement.lang = (lang === 'zh' ? 'zh-CN' : 'en');
    document.body.classList.toggle('lang-zh', lang === 'zh');
    document.body.classList.toggle('lang-en', lang !== 'zh');
    if(bEn && bZh){ bEn.classList.toggle('active', lang !== 'zh'); bZh.classList.toggle('active', lang === 'zh'); }
    try{ localStorage.setItem('sattools_lang', lang); }catch(e){}
    // let calculators re-render their dynamic text in the new language
    langCbs.forEach(cb=>{ try{ cb(lang); }catch(e){} });
  }
  let bEn, bZh;
  function initToggle(){
    const nav = document.querySelector('.topnav'); if(!nav) return;
    const box = document.createElement('div'); box.className = 'langtoggle';
    bEn = document.createElement('button'); bEn.type='button'; bEn.textContent='EN';
    bZh = document.createElement('button'); bZh.type='button'; bZh.textContent='中文';
    bEn.onclick = ()=>applyLang('en'); bZh.onclick = ()=>applyLang('zh');
    box.appendChild(bEn); box.appendChild(bZh); nav.appendChild(box);
  }
  document.addEventListener('DOMContentLoaded', function(){
    capture(); initToggle();
    let saved = 'en';
    const urlLang = new URLSearchParams(location.search).get('lang');
    if(urlLang === 'zh' || urlLang === 'en') saved = urlLang;
    else { try{ saved = localStorage.getItem('sattools_lang') || 'en'; }catch(e){} }
    applyLang(saved);
  });
})();
