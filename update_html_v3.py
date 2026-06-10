import sys
import codecs

try:
    with codecs.open('idea_forge_analysis.html', 'r', 'utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print("File not found.")
    sys.exit(1)

boundary = content.find('<body>')
if boundary == -1:
    print("Error: <body> tag not found.")
    sys.exit(1)

head_part = content[:boundary]

new_body = """<body>

    <div class="app-container">
        
        <!-- Sidebar Navigation -->
        <aside>
            <div>
                <div class="brand">
                    <div class="brand-logo">
                        <i class="fa-solid fa-satellite"></i>
                    </div>
                    <div class="brand-title">
                        <h1>Astro Code 2026</h1>
                        <p>استراتيجية التحضير</p>
                    </div>
                </div>

                <nav>
                    <ul class="nav-menu">
                        <li class="nav-item active" data-target="panel-overview">
                            <i class="fa-solid fa-house-laptop"></i>
                            <span>الخلاصة والتوجه</span>
                        </li>
                        <li class="nav-item" data-target="panel-comparison">
                            <i class="fa-solid fa-chart-simple"></i>
                            <span>مقارنة الأفكار 4</span>
                        </li>
                        <li class="nav-item" data-target="panel-najji">
                            <i class="fa-solid fa-cloud-showers-water"></i>
                            <span>الفائز: نجّي (الفيضانات)</span>
                        </li>
                        <li class="nav-item" data-target="panel-other-ideas">
                            <i class="fa-solid fa-lightbulb"></i>
                            <span>بنك الأفكار</span>
                        </li>
                        <li class="nav-item" data-target="panel-roadmap">
                            <i class="fa-solid fa-calendar-check"></i>
                            <span>الخريطة والزمن</span>
                        </li>
                        <li class="nav-item" data-target="panel-pitch">
                            <i class="fa-solid fa-person-chalkboard"></i>
                            <span>تدريب العرض (Pitch)</span>
                        </li>
                    </ul>
                </nav>
            </div>

            <div class="sidebar-footer">
                <p>تطوير فريق Astro Code 2026</p>
                <p>تم الصقل بواسطة <a href="#">Antigravity</a></p>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main>

            <!-- 1. OVERVIEW PANEL -->
            <div id="panel-overview" class="tab-panel active">
                <div class="section-header">
                    <span class="section-badge">مقدمة المنافسة - التوجه الجديد</span>
                    <h2 class="section-title">تقرير الأفكار المجتمعية (Jordan Impact)</h2>
                    <p class="section-desc">في الهاكاثونات، الشخص الذي يؤمن بمشكلته يفوز على الشخص الذي يؤمن بتقنيته. لقد تحول التركيز من "التعقيد التقني" إلى "الأثر الإنساني والاقتصادي العميق في الأردن".</p>
                </div>

                <div class="grid-3">
                    <div class="glass-card">
                        <h4 class="cairo-heading" style="color: var(--primary); font-size: 1.1rem; margin-bottom: 0.75rem;">
                            <i class="fa-solid fa-heart-pulse" style="margin-left: 0.5rem;"></i> الأثر الإنساني أولاً
                        </h4>
                        <p style="font-size: 0.95rem; color: #CBD5E1;">
                            ابتكار يمس حياة الأردنيين مباشرة (مثل الفيضانات والمياه) سيحصد تعاطف وانتباه الحكام أكثر بكثير من ابتكار فضائي بحت.
                        </p>
                    </div>

                    <div class="glass-card">
                        <h4 class="cairo-heading" style="color: var(--accent-purple); font-size: 1.1rem; margin-bottom: 0.75rem;">
                            <i class="fa-solid fa-microchip" style="margin-left: 0.5rem;"></i> بساطة التنفيذ التقني
                        </h4>
                        <p style="font-size: 0.95rem; color: #CBD5E1;">
                            الاعتماد على واجهات برمجة مفتوحة (APIs) مثل NASA GPM و Sentinel، وتطبيق معادلات هيدرولوجية واضحة بدلاً من نماذج AI معقدة.
                        </p>
                    </div>

                    <div class="glass-card">
                        <h4 class="cairo-heading" style="color: var(--color-go); font-size: 1.1rem; margin-bottom: 0.75rem;">
                            <i class="fa-solid fa-person-chalkboard" style="margin-left: 0.5rem;"></i> القصة الحقيقية (The Pitch)
                        </h4>
                        <p style="font-size: 0.95rem; color: #CBD5E1;">
                            القدرة على محاكاة فاجعة حقيقية (مثل سيول 2018) وإظهار كيف كان يمكن للنظام منعها، هي لحظة الـ "واو" التي تضمن المركز الأول.
                        </p>
                    </div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>الفكرة</th>
                                <th>المجال (القطاع)</th>
                                <th>الأثر والمشكلة</th>
                                <th>الجدوى في 24 ساعة</th>
                                <th>القرار</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="cairo-heading" style="color: var(--color-text-bright);">1. نجّي (Najji)</td>
                                <td>إنذار مبكر - كوارث</td>
                                <td>إنقاذ أرواح - سيول الوديان</td>
                                <td style="font-weight: 700; color: var(--color-go);">عالية جداً (APIs)</td>
                                <td><span class="badge badge-go"><i class="fa-solid fa-trophy"></i> الفائز الساحق</span></td>
                            </tr>
                            <tr>
                                <td class="cairo-heading" style="color: var(--color-text-bright);">2. ميّة (Miyya)</td>
                                <td>بنية تحتية - مياه</td>
                                <td>توفير ملايين الدنانير - التسرب المائي</td>
                                <td style="font-weight: 700; color: var(--color-fallback);">متوسطة (صعوبة الـ SAR)</td>
                                <td><span class="badge badge-fallback"><i class="fa-solid fa-shield-halved"></i> الأقوى اقتصادياً</span></td>
                            </tr>
                            <tr>
                                <td class="cairo-heading" style="color: var(--color-text-bright);">3. بيدر (Baydar)</td>
                                <td>زراعة - غور الأردن</td>
                                <td>دعم صغار المزارعين - إجهاد مائي</td>
                                <td style="font-weight: 700; color: var(--color-fallback);">عالية (NDVI)</td>
                                <td><span class="badge badge-secondary"><i class="fa-solid fa-leaf"></i> بديل ممتاز</span></td>
                            </tr>
                            <tr>
                                <td class="cairo-heading" style="color: var(--color-text-bright);">4. رياح (Riyah)</td>
                                <td>صحة وبيئة</td>
                                <td>التنبؤ بالعواصف الرملية للربو</td>
                                <td style="font-weight: 700; color: var(--color-muted);">متوسطة</td>
                                <td><span class="badge badge-secondary"><i class="fa-solid fa-wind"></i> فكرة جيدة</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 2. RICE COMPARISON PANEL -->
            <div id="panel-comparison" class="tab-panel">
                <div class="section-header">
                    <span class="section-badge">مقارنة القوة التحكيمية</span>
                    <h2 class="section-title">تقييم قوة العرض (Pitch Power)</h2>
                    <p class="section-desc">اضغط على أي فكرة في الرسم البياني لعرض تفاصيلها ونقاط قوتها أمام الحكام.</p>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3>توزيع الأفكار حسب القوة العاطفية والتقنية</h3>
                    </div>

                    <div class="bar-chart-container">
                        <!-- Najji -->
                        <div class="chart-row" onclick="showChartDetail('najji')">
                            <div class="chart-label">
                                <i class="fa-solid fa-cloud-showers-heavy" style="color: var(--color-go);"></i>
                                <span>1. نجّي</span>
                            </div>
                            <div class="chart-bar-wrapper">
                                <div class="chart-bar-fill" style="width: 95%; background: linear-gradient(90deg, var(--color-go), #34D399);"></div>
                            </div>
                            <div class="chart-value-text" style="color: var(--color-go);">10/10</div>
                        </div>

                        <!-- Miyya -->
                        <div class="chart-row" onclick="showChartDetail('miyya')">
                            <div class="chart-label">
                                <i class="fa-solid fa-droplet-slash" style="color: var(--color-fallback);"></i>
                                <span>2. ميّة</span>
                            </div>
                            <div class="chart-bar-wrapper">
                                <div class="chart-bar-fill" style="width: 85%; background: linear-gradient(90deg, var(--color-fallback), #FBBF24);"></div>
                            </div>
                            <div class="chart-value-text" style="color: var(--color-fallback);">8.5/10</div>
                        </div>

                        <!-- Baydar -->
                        <div class="chart-row" onclick="showChartDetail('baydar')">
                            <div class="chart-label">
                                <i class="fa-solid fa-wheat-awn" style="color: #6366F1;"></i>
                                <span>3. بيدر</span>
                            </div>
                            <div class="chart-bar-wrapper">
                                <div class="chart-bar-fill" style="width: 75%; background: rgba(99, 102, 241, 0.8);"></div>
                            </div>
                            <div class="chart-value-text" style="color: #6366F1;">7.5/10</div>
                        </div>

                        <!-- Riyah -->
                        <div class="chart-row" onclick="showChartDetail('riyah')">
                            <div class="chart-label">
                                <i class="fa-solid fa-wind" style="color: #EAB308;"></i>
                                <span>4. رياح</span>
                            </div>
                            <div class="chart-bar-wrapper">
                                <div class="chart-bar-fill" style="width: 65%; background: linear-gradient(90deg, #EAB308, #F59E0B);"></div>
                            </div>
                            <div class="chart-value-text" style="color: #EAB308;">6.5/10</div>
                        </div>
                    </div>

                    <!-- Detail Panels -->
                    <div id="detail-najji" class="chart-details-panel active">
                        <div class="details-grid">
                            <div class="detail-metric"><p>الأثر الإنساني</p><span>أسطوري</span></div>
                            <div class="detail-metric"><p>السهولة التقنية</p><span>ممتازة</span></div>
                            <div class="detail-metric"><p>قوة العرض</p><span>قاطعة</span></div>
                            <div class="detail-metric"><p>المصداقية</p><span>عالية جداً</span></div>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.95rem; color: #CBD5E1;">
                            <strong>لماذا "نجّي"؟</strong> لأنها تنقذ أرواحاً. العرض الذي يستحضر ذكرى ضحايا سيول 2018 ويوضح كيف كان من الممكن إنقاذهم بتنبيه يسبق الكارثة بـ 45 دقيقة، لا يمكن هزيمته عاطفياً.
                        </p>
                    </div>

                    <div id="detail-miyya" class="chart-details-panel">
                        <div class="details-grid">
                            <div class="detail-metric"><p>الأثر الاقتصادي</p><span>هائل</span></div>
                            <div class="detail-metric"><p>السهولة التقنية</p><span>صعبة جداً</span></div>
                            <div class="detail-metric"><p>قوة العرض</p><span>قوية</span></div>
                            <div class="detail-metric"><p>المصداقية</p><span>متوسطة (دقة الـ SAR)</span></div>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.95rem; color: #CBD5E1;">
                            <strong>لماذا "ميّة" بالمركز الثاني؟</strong> الأردن يخسر 50% من مياهه بسبب التسرب. حل هذه المشكلة بالرادار هو إنجاز تقني واقتصادي مرعب، لكنه يفتقد للضربة العاطفية الفورية، وإثباته في 24 ساعة تقنياً صعب ومعرض للأخطاء.
                        </p>
                    </div>

                    <div id="detail-baydar" class="chart-details-panel">
                        <div class="details-grid">
                            <div class="detail-metric"><p>الأثر التنموي</p><span>عالي</span></div>
                            <div class="detail-metric"><p>السهولة التقنية</p><span>سهلة</span></div>
                            <div class="detail-metric"><p>قوة العرض</p><span>متوسطة</span></div>
                            <div class="detail-metric"><p>المصداقية</p><span>عالية</span></div>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.95rem; color: #CBD5E1;">
                            <strong>عن "بيدر":</strong> دعم المزارعين البسطاء في الغور ببيانات الأقمار الصناعية (NDVI/NDWI) عبر رسائل SMS. مشروع نبيل جداً وسهل التنفيذ، ولكنه يفتقد للابتكار الصادم (Wow Factor).
                        </p>
                    </div>

                    <div id="detail-riyah" class="chart-details-panel">
                        <div class="details-grid">
                            <div class="detail-metric"><p>الأثر الصحي</p><span>عالي</span></div>
                            <div class="detail-metric"><p>السهولة التقنية</p><span>متوسطة</span></div>
                            <div class="detail-metric"><p>قوة العرض</p><span>متوسطة</span></div>
                            <div class="detail-metric"><p>المصداقية</p><span>عالية</span></div>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.95rem; color: #CBD5E1;">
                            <strong>عن "رياح":</strong> تنبؤ بالعواصف الرملية لإنقاذ مرضى الربو والجاهزية الطبية. الفكرة ممتازة إنسانياً وصحياً وتعتمد على بيانات الأقمار الصناعية لغبار الصحراء (MODIS)، إلا أن أثرها التنافسي في هاكاثون 24 ساعة يقل قليلاً عن إنقاذ الأرواح المباشر في السيول.
                        </p>
                    </div>
                </div>
            </div>

            <!-- 3. SELECTED WINNER: NAJJI -->
            <div id="panel-najji" class="tab-panel">
                <div class="section-header">
                    <span class="section-badge" style="background: rgba(16, 185, 129, 0.2); color: #10B981; border-color: #10B981;">المشروع الفائز للهاكاثون</span>
                    <h2 class="section-title">نجّي (Najji): التفصيل المعماري (Hydro-Logic)</h2>
                    <p class="section-desc">النظام ليس مجرد واجهة عرض للطقس. هو محرك هندسي حقيقي يربط غزارة هطول الأمطار الفضائية مع التضاريس الجبلية لتوقع حجم السيول قبل وقوعها.</p>
                </div>

                <div class="diagram-container">
                    <svg class="diagram-svg" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- Step 1 Box -->
                        <rect x="10" y="70" width="140" height="90" rx="10" fill="#141424" stroke="#6366F1" stroke-width="2"/>
                        <text x="80" y="110" fill="#FFFFFF" font-family="Cairo" font-size="14" font-weight="700" text-anchor="middle">NASA GPM IMERG</text>
                        <text x="80" y="135" fill="#94A3B8" font-family="Tajawal" font-size="11" text-anchor="middle">شـدة الهـطول (i)</text>
                        
                        <!-- Arrow 1 -->
                        <path d="M160 115 L200 115" stroke="#6366F1" stroke-width="2" stroke-dasharray="4 4"/>
                        <polygon points="200,115 192,111 192,119" fill="#6366F1"/>
                        
                        <!-- Step 2 Box -->
                        <rect x="210" y="70" width="150" height="90" rx="10" fill="#141424" stroke="#8B5CF6" stroke-width="2"/>
                        <text x="285" y="110" fill="#FFFFFF" font-family="Cairo" font-size="14" font-weight="700" text-anchor="middle">SRTM DEM Map</text>
                        <text x="285" y="135" fill="#94A3B8" font-family="Tajawal" font-size="11" text-anchor="middle">مسـاحـة الحـوض (A)</text>

                        <!-- Arrow 2 -->
                        <path d="M370 115 L410 115" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="4 4"/>
                        <polygon points="410,115 402,111 402,119" fill="#8B5CF6"/>

                        <!-- Step 3 Box -->
                        <rect x="420" y="70" width="160" height="90" rx="10" fill="#141424" stroke="#10B981" stroke-width="2"/>
                        <text x="500" y="105" fill="#FFFFFF" font-family="Cairo" font-size="14" font-weight="700" text-anchor="middle">Q = C × i × A</text>
                        <text x="500" y="125" fill="#10B981" font-family="Cairo" font-size="12" font-weight="700" text-anchor="middle">Hydro-Logic Engine</text>
                        <text x="500" y="145" fill="#94A3B8" font-family="Tajawal" font-size="11" text-anchor="middle">حساب ذروة التصريف المائي</text>

                        <!-- Arrow 3 -->
                        <path d="M590 115 L630 115" stroke="#10B981" stroke-width="2" stroke-dasharray="4 4"/>
                        <polygon points="630,115 622,111 622,119" fill="#10B981"/>

                        <!-- Step 4 Box -->
                        <rect x="640" y="70" width="150" height="90" rx="10" fill="#141424" stroke="#EC4899" stroke-width="2"/>
                        <text x="715" y="110" fill="#FFFFFF" font-family="Cairo" font-size="14" font-weight="700" text-anchor="middle">ToC Countdown</text>
                        <text x="715" y="135" fill="#94A3B8" font-family="Tajawal" font-size="11" text-anchor="middle">إنذار ذكي بوقت الوصول</text>
                    </svg>
                </div>

                <div class="split-2">
                    <div class="glass-card go-card">
                        <h3 class="cairo-heading" style="color: var(--color-go); margin-bottom: 1rem; font-size: 1.25rem;">
                            <i class="fa-solid fa-laptop-code" style="margin-left: 0.5rem;"></i> الشرح المعماري المتقدم
                        </h3>
                        <p style="font-size: 0.95rem; color: #E2E8F0; margin-bottom: 0.75rem;">
                            لا نعتمد على الذكاء الاصطناعي "الأسود" (Black-box AI), بل على ميكانيكا الموائع الهيدرولوجية المدعمة ببيانات فضائية:
                        </p>
                        <ul class="details-list">
                            <li><strong style="color:white;">C (مُعامل الجريان):</strong> جبال الأردن صخرية لا تمتص الماء، لذا نضع المعامل مرتفعاً (0.7).</li>
                            <li><strong style="color:white;">i (شدة الهطول):</strong> تُسحب لحظياً من GPM بدقة 10كم.</li>
                            <li><strong style="color:white;">A (مساحة الحوض):</strong> مرسومة مسبقاً من نموذج الارتفاع الرقمي DEM بدقة 30 متر.</li>
                        </ul>
                        <p style="font-size: 0.95rem; color: #CBD5E1; margin-top:0.75rem;">
                            بضرب هذه القيم، يحسب النظام كمية المياه المتدفقة للوادي (Peak Discharge - Q). إذا تجاوزت عتبة الخطر، يبدأ العداد.
                        </p>
                    </div>

                    <div class="glass-card fallback-card">
                        <h3 class="cairo-heading" style="color: var(--color-fallback); margin-bottom: 1rem; font-size: 1.25rem;">
                            <i class="fa-solid fa-map-location-dot" style="margin-left: 0.5rem;"></i> خطة الـ Killer Demo (سيول 2018)
                        </h3>
                        <p style="font-size: 0.95rem; color: #E2E8F0; margin-bottom: 0.75rem;">
                            السر في الفوز هو استعراض الكارثة السابقة:
                        </p>
                        <ul class="details-list">
                            <li>سحب بيانات الهطول الفضائية لتاريخ <strong>25 أكتوبر 2018</strong>.</li>
                            <li>تغذية النظام بها كما لو كانت "مباشرة في هذه اللحظة".</li>
                            <li>المحرك الهيدرولوجي سيكتشف أن (Q) تجاوز الخط الأحمر بشكل جنوني.</li>
                            <li>تُضيء الواجهة "وادي زرقاء ماعين" باللون الأحمر مع عرض رسالة صادمة: <strong>"تنبيه إخلاء: وصول سيول خلال 45 دقيقة"</strong>. هذه هي الدقيقة التي كلف غيابها 21 روحاً.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 4. OTHER IDEAS PANEL -->
            <div id="panel-other-ideas" class="tab-panel">
                <div class="section-header">
                    <span class="section-badge">الأفكار الاحتياطية</span>
                    <h2 class="section-title">بنك الأفكار البديلة القوية</h2>
                    <p class="section-desc">إذا قررت في اللحظة الأخيرة تغيير المشروع، هذه هي الأفكار التي تحمل وزناً حقيقياً في سياق الأردن.</p>
                </div>

                <div class="grid-3">
                    <div class="glass-card kill-card" style="border-right-color: #3B82F6;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <h4 class="cairo-heading" style="color: #3B82F6; font-size: 1.15rem;">ميّة (Miyya)</h4>
                            <i class="fa-solid fa-faucet-drip" style="font-size: 1.5rem; color: #3B82F6;"></i>
                        </div>
                        <p style="font-size: 0.9rem; color: #E2E8F0; margin-bottom: 1rem;">
                            استخدام بيانات SAR لكشف رطوبة التربة غير المبررة (رطوبة تحت الأرض بدون هطول مطري) لتحديد مواقع التسرب المائي المكسور في شبكات مياه الأردن المتهالكة التي تهدر 50% من المياه.
                        </p>
                        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 0.75rem;">
                        <span style="font-size: 0.8rem; color: var(--color-muted); display: block;">
                            <i class="fa-solid fa-circle-info"></i> توفير اقتصادي مرعب على ميزانية الدولة.
                        </span>
                    </div>

                    <div class="glass-card kill-card" style="border-right-color: #EAB308;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <h4 class="cairo-heading" style="color: #EAB308; font-size: 1.15rem;">رياح (Riyah)</h4>
                            <i class="fa-solid fa-wind" style="font-size: 1.5rem; color: #EAB308;"></i>
                        </div>
                        <p style="font-size: 0.9rem; color: #E2E8F0; margin-bottom: 1rem;">
                            نظام يدمج بيانات الغبار الفضائي (MODIS/Sentinel-5P) مع اتجاهات الرياح وتضاريس الأردن الشرقية، لتحذير مرضى الربو والمستشفيات قبل وصول العواصف الرملية للأنظمة التنفسية.
                        </p>
                        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 0.75rem;">
                        <span style="font-size: 0.8rem; color: var(--color-muted); display: block;">
                            <i class="fa-solid fa-circle-info"></i> أثر صحي كبير جداً وتقنية معقولة.
                        </span>
                    </div>
                    
                    <div class="glass-card kill-card" style="border-right-color: #10B981;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <h4 class="cairo-heading" style="color: #10B981; font-size: 1.15rem;">بيدر (Baydar)</h4>
                            <i class="fa-solid fa-seedling" style="font-size: 1.5rem; color: #10B981;"></i>
                        </div>
                        <p style="font-size: 0.9rem; color: #E2E8F0; margin-bottom: 1rem;">
                            تتبع مؤشرات الجفاف الفضائية (NDVI) في مزارع غور الأردن المصغرة وإرسال تنبيهات SMS عبر الهاتف القديم (لا يحتاج إنترنت) لتنبيه المزارع الصغير بوجوب زيادة الري قبل تلف محصوله.
                        </p>
                        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 0.75rem;">
                        <span style="font-size: 0.8rem; color: var(--color-muted); display: block;">
                            <i class="fa-solid fa-circle-info"></i> دعم الأمن الغذائي بأسلوب إنساني نبيل.
                        </span>
                    </div>
                </div>
            </div>

            <!-- 5. ROADMAP & CHECKLIST PANEL -->
            <div id="panel-roadmap" class="tab-panel">
                <div class="section-header">
                    <span class="section-badge">خطة تنفيذ "نجّي"</span>
                    <h2 class="section-title">خريطة طريق الـ 24 ساعة</h2>
                    <p class="section-desc">تحتاج لتجهيز بيئة العمل والخرائط قبل صافرة البداية لتتفرغ للبرمجة الحقيقية والجماليات.</p>
                </div>

                <div class="split-2">
                    <div class="glass-card">
                        <h3 class="cairo-heading" style="color: var(--primary); margin-bottom: 1.5rem; font-size: 1.25rem;">
                            <i class="fa-solid fa-list-check" style="margin-left: 0.5rem;"></i> التجهيز المسبق (قبل الهاكاثون)
                        </h3>
                        <div class="checklist-container">
                            <div class="task-card" onclick="toggleTask(this)">
                                <div class="checkbox-custom"><i class="fa-solid fa-check"></i></div>
                                <span class="task-text">تحميل خريطة الارتفاعات (DEM) لمنطقة وادي زرقاء ماعين والبتراء من EarthExplorer.</span>
                            </div>
                            <div class="task-card" onclick="toggleTask(this)">
                                <div class="checkbox-custom"><i class="fa-solid fa-check"></i></div>
                                <span class="task-text">إنشاء حساب للحصول على مفاتيح API الخاصة بـ NASA GPM (الهطول المطري).</span>
                            </div>
                            <div class="task-card" onclick="toggleTask(this)">
                                <div class="checkbox-custom"><i class="fa-solid fa-check"></i></div>
                                <span class="task-text">تجهيز بيئة Python (Pandas, Rasterio, Folium) أو واجهة Next.js سريعة.</span>
                            </div>
                            <div class="task-card" onclick="toggleTask(this)">
                                <div class="checkbox-custom"><i class="fa-solid fa-check"></i></div>
                                <span class="task-text">تصميم واجهة مستخدم (UI/UX) أساسية مظلمة وجاهزة للبرمجة.</span>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card">
                        <h3 class="cairo-heading" style="color: var(--color-go); margin-bottom: 1.5rem; font-size: 1.25rem;">
                            <i class="fa-solid fa-clock" style="margin-left: 0.5rem;"></i> جدول الـ 24 ساعة
                        </h3>
                        <div class="timeline">
                            <div class="timeline-item completed">
                                <div class="timeline-header">
                                    <span class="timeline-title">ربط البيانات (Data Intake)</span>
                                    <span class="timeline-time">الساعة 0 - 4</span>
                                </div>
                                <p class="timeline-desc">برمجة سحب بيانات GPM لتواريخ محددة (أكتوبر 2018 للـ Demo، واليوم للبيانات الحية) وتحويلها إلى مصفوفات مفهومة.</p>
                            </div>
                            
                            <div class="timeline-item">
                                <div class="timeline-header">
                                    <span class="timeline-title">المحرك الهيدرولوجي (Hydro-Logic)</span>
                                    <span class="timeline-time">الساعة 4 - 10</span>
                                </div>
                                <p class="timeline-desc">برمجة محرك الـ (Q = C * i * A). حساب كمية المياه المتجمعة، وإذا تجاوزت عتبة الخطر -> إطلاق التنبيه والبدء بحساب زمن التركيز ToC.</p>
                            </div>

                            <div class="timeline-item">
                                <div class="timeline-header">
                                    <span class="timeline-title">الخريطة التفاعلية (The Map)</span>
                                    <span class="timeline-time">الساعة 10 - 18</span>
                                </div>
                                <p class="timeline-desc">إنشاء خريطة الأردن، إسقاط غيوم المطر عليها بصرياً، وإضافة وميض أحمر على مناطق الخطر مع العداد التنازلي.</p>
                            </div>

                            <div class="timeline-item">
                                <div class="timeline-header">
                                    <span class="timeline-title">التلميع وبروفا العرض</span>
                                    <span class="timeline-time">الساعة 18 - 24</span>
                                </div>
                                <p class="timeline-desc">التأكد من خلو النظام من الأخطاء أثناء العرض، وكتابة الـ Pitch Deck والتدرب على إلقائه بأسلوب عاطفي وقوي.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 6. PITCH DECK SIMULATOR -->
            <div id="panel-pitch" class="tab-panel">
                <div class="section-header">
                    <span class="section-badge">بناء القصة (Storytelling)</span>
                    <h2 class="section-title">محاكي شرائح العرض التقديمي (Pitch Simulator)</h2>
                    <p class="section-desc">كيف تبيع فكرة "نجّي" للحكام؟ السر في البداية العاطفية القوية والانتقال للحل التقني القاطع.</p>
                </div>

                <div class="pitch-deck">
                    <div class="pitch-screen">
                        <!-- Slide 1 -->
                        <div class="pitch-slide active" data-slide="1">
                            <span class="slide-num">شريحة 1 / 5</span>
                            <span class="slide-time"><i class="fa-regular fa-clock"></i> الدقيقة 0:00</span>
                            <h3 class="slide-title">الجرح الأردني (The Hook)</h3>
                            <p class="slide-body">
                                "في 25 أكتوبر 2018، فقدنا 21 روحاً بريئة في زرقاء ماعين. التحذيرات الرسمية كانت تقول (احذروا المنخفض)، لكن أحداً لم يعرف متى وأين سيضرب السيل بالضبط."
                            </p>
                            <div class="slide-notes">
                                <h5>💡 ملاحظات الحكام والأداء:</h5>
                                <p>الهدوء التام. ابدأ بصوت واثق لكن حزين. يجب أن تكون الشاشة شبه سوداء ربما مع تاريخ (25/10/2018) فقط. هذه الدقيقة تضمن انتباه جميع من في القاعة.</p>
                            </div>
                        </div>

                        <!-- Slide 2 -->
                        <div class="pitch-slide" data-slide="2">
                            <span class="slide-num">شريحة 2 / 5</span>
                            <span class="slide-time"><i class="fa-regular fa-clock"></i> الدقيقة 1:00</span>
                            <h3 class="slide-title">المشكلة التقنية (The Gap)</h3>
                            <p class="slide-body">
                                "السيل يبدأ في قمم الجبال وينزل بسرعة هائلة. الرادارات الأرضية محدودة، والتنبؤات الجوية عامة وليست مخصصة جغرافياً للمناطق المنخفضة."
                            </p>
                            <div class="slide-notes">
                                <h5>💡 ملاحظات الحكام والأداء:</h5>
                                <p>هنا تفسر لماذا حدثت الكارثة علمياً، ولماذا لم تستطع مديرية الأرصاد الجوية تدارك الأمر بدقة.</p>
                            </div>
                        </div>

                        <!-- Slide 3 -->
                        <div class="pitch-slide" data-slide="3">
                            <span class="slide-num">شريحة 3 / 5</span>
                            <span class="slide-time"><i class="fa-regular fa-clock"></i> الدقيقة 2:00</span>
                            <h3 class="slide-title">الابتكار: نظام "نجّي"</h3>
                            <p class="slide-body">
                                "نقدم لكم 'نجّي'. نظام يسحب بيانات الهطول المطري اللحظية من أقمار NASA GPM، ويحللها هيدرولوجياً فورياً (Q = C × i × A) بناءً على مساحة أحواض التجميع في الأردن، ليتوقع مسار السيل قبل وصوله بمدة كافية."
                            </p>
                            <div class="slide-notes">
                                <h5>💡 ملاحظات الحكام والأداء:</h5>
                                <p>اشرح البنية التقنية بوضوح وسرعة. اذكر أسماء الأقمار والوكالات (NASA) والمعادلة لإضفاء المصداقية التقنية القوية.</p>
                            </div>
                        </div>

                        <!-- Slide 4 -->
                        <div class="pitch-slide" data-slide="4">
                            <span class="slide-num">شريحة 4 / 5</span>
                            <span class="slide-time"><i class="fa-regular fa-clock"></i> الدقيقة 3:00</span>
                            <h3 class="slide-title">العرض الحي للماضي (The Killer Demo)</h3>
                            <p class="slide-body">
                                "دعونا نعود بالزمن إلى 2018. هذا ما كان ليراه الدفاع المدني عبر 'نجّي'.. (الشاشة تومض بالأحمر).. تنبيه قبل 45 دقيقة كاملة: إخلاء وادي زرقاء ماعين فوراً."
                            </p>
                            <div class="slide-notes">
                                <h5>💡 ملاحظات الحكام والأداء:</h5>
                                <p>اضغط على زر تشغيل المحاكاة الحية. هذه هي لحظة "واو". إضاءة الإنذار والعداد التنازلي ستكون كافية لإثبات عبقرية النظام وفائدته العظيمة.</p>
                            </div>
                        </div>

                        <!-- Slide 5 -->
                        <div class="pitch-slide" data-slide="5">
                            <span class="slide-num">شريحة 5 / 5</span>
                            <span class="slide-time"><i class="fa-regular fa-clock"></i> الدقيقة 4:30</span>
                            <h3 class="slide-title">التطبيق الفوري والجاهزية</h3>
                            <p class="slide-body">
                                "نجّي ليس مجرد فكرة هاكاثون. إنه نظام يعتمد على بيانات فضائية مجانية بالكامل ومفتوحة المصدر. يمكن تطبيقه ودمجه في غرف عمليات المركز الوطني للأمن وإدارة الأزمات صباح الغد.. ولن نفقد أرواحاً أخرى بسبب السيول."
                            </p>
                            <div class="slide-notes">
                                <h5>💡 ملاحظات الحكام والأداء:</h5>
                                <p>اختم العرض بنبرة تفاؤل وحل. أنت قمت بتسليم منتج جاهز، منخفض التكلفة، عالي القيمة، ومنقذ للحياة. لا يمكن منافسة هذا الختام.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pitch-controls">
                        <button class="pitch-btn" id="btn-prev" onclick="changeSlide(-1)" disabled>
                            <i class="fa-solid fa-arrow-right"></i> السابق
                        </button>
                        
                        <div class="pitch-progress-dots">
                            <div class="progress-dot active" onclick="goToSlide(1)"></div>
                            <div class="progress-dot" onclick="goToSlide(2)"></div>
                            <div class="progress-dot" onclick="goToSlide(3)"></div>
                            <div class="progress-dot" onclick="goToSlide(4)"></div>
                            <div class="progress-dot" onclick="goToSlide(5)"></div>
                        </div>
                        
                        <button class="pitch-btn" id="btn-next" onclick="changeSlide(1)">
                            التالي <i class="fa-solid fa-arrow-left"></i>
                        </button>
                    </div>
                </div>
            </div>

        </main>
    </div>

    <script>
        // Tab Switching Logic
        const navItems = document.querySelectorAll('.nav-item');
        const tabPanels = document.querySelectorAll('.tab-panel');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active classes
                navItems.forEach(nav => nav.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));

                // Add active class to clicked tab and its content panel
                item.classList.add('active');
                const targetId = item.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });

        // Interactive RICE Detail switcher
        function showChartDetail(idea) {
            const panels = document.querySelectorAll('.chart-details-panel');
            panels.forEach(p => p.classList.remove('active'));
            
            const targetPanel = document.getElementById(`detail-${idea}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        }

        // Interactive Pre-Hackathon Checklist Logic
        function toggleTask(element) {
            element.classList.toggle('checked');
        }

        // Pitch Simulator Slider
        let currentSlide = 1;
        const totalSlides = 5;

        function changeSlide(direction) {
            goToSlide(currentSlide + direction);
        }

        function goToSlide(slideNum) {
            if (slideNum < 1 || slideNum > totalSlides) return;
            
            currentSlide = slideNum;
            
            // Toggle active classes on slides
            const slides = document.querySelectorAll('.pitch-slide');
            slides.forEach(s => s.classList.remove('active'));
            document.querySelector(`.pitch-slide[data-slide="${currentSlide}"]`).classList.add('active');
            
            // Toggle active classes on dots
            const dots = document.querySelectorAll('.progress-dot');
            dots.forEach((d, idx) => {
                if (idx === currentSlide - 1) {
                    d.classList.add('active');
                } else {
                    d.classList.remove('active');
                }
            });

            // Handle button states
            document.getElementById('btn-prev').disabled = (currentSlide === 1);
            document.getElementById('btn-next').disabled = (currentSlide === totalSlides);
        }
    </script>
</body>
</html>"""

with codecs.open('idea_forge_analysis.html', 'w', 'utf-8') as f:
    f.write(head_part + new_body)

print("HTML updated successfully with v3.")
