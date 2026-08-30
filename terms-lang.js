document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        ge: {
            pageTitle: "წესები და პირობები | OSG Digital Agency",
            backLink: "← მთავარ გვერდზე დაბრუნება",
            pageH1: "წესები და პირობები",
            pageIntro: "გთხოვთ, ყურადღებით გაეცნოთ მომსახურების პირობებს ჩვენთან თანამშრომლობის დაწყებამდე.",

            clause1Title: "ინტელექტუალური საკუთრების უფლება",
            clause1Body: "ვებსაიტის კოდი, დიზაინი და ყველა მასალა წარმოადგენს შემსრულებლის (OSG) საკუთრებას და კლიენტის მფლობელობაში სრულად გადადის მხოლოდ მომსახურების სრული ღირებულების სრულად დაფარვის შემდეგ, არჩეული გადახდის გეგმის მიუხედავად (50/50, 3-თვიანი ან 6-თვიანი).",

            clause2Title: "გადახდის მოდელები და სავალდებულო პერიოდი",
            clause2Body: "თანამშრომლობა ხორციელდება სამი შეთანხმებული გადახდის გეგმიდან ერთ-ერთით:<br><br>50/50 გეგმა: 50% იფარება სამუშაოს დაწყებამდე (ავანსი), ხოლო დარჩენილი 50% — პროექტის დასრულებისთანავე, საიტის ინტერნეტში გაშვებამდე (Live).<br><br>3-თვიანი გეგმა: მთლიანი ღირებულება (დამატებული მომსახურების საკომისიოს ჩათვლით) იყოფა 3 თანაბარ ყოველთვიურ შენატანად.<br><br>6-თვიანი გეგმა: მთლიანი ღირებულება (დამატებული მომსახურების საკომისიოს ჩათვლით) იყოფა 6 თანაბარ ყოველთვიურ შენატანად.<br><br>3-თვიანი და 6-თვიანი გეგმებისთვის, ხელშეკრულება სავალდებულოა არჩეული სრული ვადით. თუ კლიენტი შეწყვეტს ხელშეკრულებას ყველა შენატანის სრულად დაფარვამდე, შესრულებული სამუშაოს საკომპენსაციოდ გამოიყენება ფიქსირებული ჯარიმა, ხოლო დარჩენილი თანხა დაუყოვნებლივ ექვემდებარება გადახდას.",

            clause3Title: "მომსახურების შეჩერება და გათიშვა",
            clause3Body: "3-თვიანი ან 6-თვიანი გეგმის ფარგლებში ყოველთვიური შენატანის 5 კალენდარული დღით გადაცილების, ან 50/50 გეგმის შემთხვევაში დარჩენილი 50%-ის დროულად გადაუხდელობის შემთხვევაში, შემსრულებელს (OSG) აქვს უფლება გაფრთხილების გარეშე შეაჩეროს სამუშაოები ან სრულად გათიშოს ვებსაიტი ინტერნეტ სივრციდან დავალიანების სრულად დაფარვამდე.",

            clause4Title: "მასალების მოწოდება და პროექტის ვადები",
            clause4Body: "კლიენტი იღებს ვალდებულებას, მოაწოდოს შემსრულებელს (OSG) ვებსაიტისთვის საჭირო ყველა ტექსტური თუ ვიზუალური მასალა შეთანხმებულ ვადაში. კლიენტის მხრიდან მასალების დაგვიანება არ აჩერებს პროექტის ვადებს ან ყოველთვიური გადასახადის ათვლას.",

            clause5Title: "სამუშაო არეალი და ცვლილებები",
            clause5Body: "მომსახურება მოიცავს მხოლოდ თავდაპირველად შეთანხმებულ ფუნქციონალსა და დიზაინს. პროექტის დამტკიცების შემდეგ ნებისმიერი ახალი ფუნქციონალის ან სტრუქტურული ცვლილების დამატება წარმოადგენს ცალკე მომსახურებას და ექვემდებარება დამატებით საფასურს. თავის მხრივ, შემსრულებელი (OSG) იღებს ვალდებულებას, დროულად, წერილობითი ფორმით შეატყობინოს კლიენტს შეთანხმებულ ვადებში ნებისმიერი მოსალოდნელი შეფერხების შესახებ, განახლებული სავარაუდო მიწოდების თარიღთან ერთად.",

            clause6Title: "თანხის დაბრუნების პოლიტიკა",
            clause6Body: "სამუშაოს დაწყების (დიზაინის/კოდის შემუშავების) შემდეგ, 50/50 გეგმის ფარგლებში გადახდილი პირველადი 50%-იანი ავანსი, ან 3-თვიანი/6-თვიანი გეგმის პირველი შენატანი, უკან დაბრუნებას არ ექვემდებარება, რადგან ის ფარავს უკვე გაწეულ სამუშაო საათებსა და რესურსს.",

            clause7Title: "პასუხისმგებლობის შეზღუდვა",
            clause7Body: "შემსრულებელი (OSG) არ იღებს პასუხისმგებლობას ვებსაიტის დროებით შეფერხებაზე, თუ ეს გამოწვეულია მესამე მხარის სერვისების (ჰოსტინგ პროვაიდერი, დომენის რეგისტრატორი, საგადახდო სისტემები) ტექნიკური ხარვეზებით ან ფორს-მაჟორული სიტუაციებით.",

            clause8Title: "მონაცემთა კონფიდენციალურობა",
            clause8Body: "OSG უზრუნველყოფს კლიენტის მიერ მოწოდებული საკონტაქტო და ბიზნეს ინფორმაციის სრულ კონფიდენციალურობას და იღებს ვალდებულებას, არ გადასცეს ის მესამე პირებს.",

            clause9Title: "პორტფოლიო და მარკეტინგი",
            clause9Body: "შემსრულებელს (OSG) აქვს უფლება, დამზადებული ვებსაიტი, მისი ვიზუალური ელემენტები და მიღწეული შედეგები (ქეისები) გამოიყენოს საკუთარ პორტფოლიოში, სოციალურ ქსელებსა და სარეკლამო მასალებში, თუ მხარეებს შორის არ არის გაფორმებული ცალკე NDA (კონფიდენციალურობის შეთანხმება).",

            clause10Title: "პროექტის მიღება-ჩაბარება",
            clause10Body: "ვებსაიტის სატესტო ვერსიის გადაცემის შემდეგ, კლიენტს აქვს 5 სამუშაო დღე შენიშვნებისა და ხარვეზების მოსაწოდებლად. აღნიშნულ ვადაში უკუკავშირის არარსებობის შემთხვევაში, სამუშაო ითვლება სრულად და ჯეროვნად შესრულებულად.",

            clause11Title: "საგარანტიო მომსახურების ვადა",
            clause11Body: "ვებსაიტის ინტერნეტში გაშვებიდან OSG უსასყიდლოდ ასწორებს გამოვლენილ ტექნიკურ ხარვეზებსა და მცირე შესწორებებს, არჩეული პაკეტის შესაბამისად:<br><br>Starter პაკეტი: 14 დღე;<br>Pro პაკეტი: 21 დღე;<br>Premium პაკეტი: 3 თვე (90 დღე).<br><br>აღნიშნული საგარანტიო ვადების გასვლის შემდეგ, ნებისმიერი ტექნიკური მხარდაჭერა, განახლება ან ცვლილება ხორციელდება ცალკე შეთანხმებული ტარიფით.",

            footnote: "ბოლო განახლება: 2026 წლის ივლისი · კითხვების შემთხვევაში დაგვიკავშირდით — <a href=\"mailto:osgbusiness01@gmail.com\">osgbusiness01@gmail.com</a>",

            footerAbout: "ინოვაციური ციფრული გამოცდილება ბრენდის წარმატებისთვის.",
            footerContactTitle: "კონტაქტი",
            footerSocialTitle: "გამოგვყევით",
            footerCopyright: "© 2026 OSG Digital Agency. ყველა უფლება დაცულია.",
            footerTermsLink: "წესები და პირობები"
        },
        en: {
            pageTitle: "Terms of Service | OSG Digital Agency",
            backLink: "← Back to Homepage",
            pageH1: "Terms of Service",
            pageIntro: "Please read the terms of service carefully before we begin our collaboration.",

            clause1Title: "Intellectual Property Rights",
            clause1Body: "The website's code, design, and all materials are the property of the Contractor (OSG) and are transferred in full to the Client's ownership only after the total cost of the service has been paid in full, regardless of the payment plan chosen (50/50, 3-Month, or 6-Month).",

            clause2Title: "Payment Models and Mandatory Term",
            clause2Body: "Cooperation is carried out under one of three agreed payment plans:<br><br>50/50 Plan: 50% is paid before work begins (advance), and the remaining 50% immediately upon completion of the project, before the website goes live.<br><br>3-Month Plan: the total cost (including an added service fee) is divided into 3 equal monthly installments.<br><br>6-Month Plan: the total cost (including an added service fee) is divided into 6 equal monthly installments.<br><br>For the 3-Month and 6-Month plans, the agreement is binding for the full selected duration. If the Client terminates the agreement before all installments are paid, a fixed penalty applies to compensate for the work already performed, and any remaining balance becomes immediately due.",

            clause3Title: "Suspension and Disconnection of Service",
            clause3Body: "If a monthly installment under the 3-Month or 6-Month plan is delayed by 5 calendar days, or if the remaining 50% under the 50/50 plan is not paid on time, the Contractor (OSG) has the right, without prior notice, to suspend work or take the website fully offline until the outstanding balance is paid in full.",

            clause4Title: "Provision of Materials and Project Deadlines",
            clause4Body: "The Client undertakes to provide the Contractor (OSG) with all text and visual materials required for the website within the agreed timeframe. Delays by the Client in providing materials do not pause the project deadlines or the counting of the monthly payment cycle.",

            clause5Title: "Scope of Work and Changes",
            clause5Body: "The service covers only the functionality and design initially agreed upon. After the project has been approved, adding any new functionality or making structural changes constitutes a separate service and is subject to an additional fee. In turn, the Contractor (OSG) commits to notifying the Client promptly, in writing, of any expected delay to the agreed project timeline, along with a revised estimated delivery date.",

            clause6Title: "Refund Policy",
            clause6Body: "Once work has begun (design/code development), the initial 50% advance under the 50/50 plan, or the first installment under the 3-Month or 6-Month plan, is non-refundable, as it covers work hours and resources already spent.",

            clause7Title: "Limitation of Liability",
            clause7Body: "The Contractor (OSG) is not liable for temporary website disruptions caused by technical faults in third-party services (hosting provider, domain registrar, payment systems) or by force majeure events.",

            clause8Title: "Data Confidentiality",
            clause8Body: "OSG ensures the full confidentiality of the contact and business information provided by the Client and undertakes not to disclose it to third parties.",

            clause9Title: "Portfolio and Marketing",
            clause9Body: "The Contractor (OSG) has the right to use the completed website, its visual elements, and the results achieved (case studies) in its own portfolio, social media, and promotional materials, unless a separate NDA (non-disclosure agreement) has been signed between the parties.",

            clause10Title: "Project Acceptance and Handover",
            clause10Body: "After the test version of the website is delivered, the Client has 5 business days to submit comments and report any issues. If no feedback is received within this period, the work is considered fully and properly completed.",

            clause11Title: "Warranty Period",
            clause11Body: "From the moment the website goes live, OSG will fix any identified technical faults and minor corrections free of charge, according to the selected package:<br><br>Starter package: 14 days;<br>Pro package: 21 days;<br>Premium package: 3 months (90 days).<br><br>After these warranty periods expire, any technical support, updates, or changes will be provided under a separately agreed rate.",

            footnote: "Last updated: July 2026 · If you have any questions, contact us — <a href=\"mailto:osgbusiness01@gmail.com\">osgbusiness01@gmail.com</a>",

            footerAbout: "A top 1% boutique studio engineering digital presence for brands that demand excellence.",
            footerContactTitle: "Contact",
            footerSocialTitle: "Follow Us",
            footerCopyright: "© 2026 OSG Digital Agency. All Rights Reserved.",
            footerTermsLink: "Terms of Service"
        },
        ru: {
            pageTitle: "Условия использования | OSG Digital Agency",
            backLink: "← Вернуться на главную",
            pageH1: "Условия использования",
            pageIntro: "Пожалуйста, внимательно ознакомьтесь с условиями обслуживания перед началом сотрудничества с нами.",

            clause1Title: "Права на интеллектуальную собственность",
            clause1Body: "Код сайта, дизайн и все материалы являются собственностью Исполнителя (OSG) и переходят в полную собственность Клиента только после полной оплаты стоимости услуги , независимо от выбранного плана оплаты (50/50, 3 месяца или 6 месяцев).",

            clause2Title: "Модели оплаты и обязательный срок",
            clause2Body: "Сотрудничество осуществляется по одному из трёх согласованных планов оплаты:<br><br>План 50/50: 50% оплачивается до начала работ (предоплата), а оставшиеся 50% — сразу после завершения проекта, до запуска сайта в интернете (Live).<br><br>План на 3 месяца: полная стоимость (включая дополнительную комиссию за услугу) делится на 3 равных ежемесячных платежа.<br><br>План на 6 месяцев: полная стоимость (включая дополнительную комиссию за услугу) делится на 6 равных ежемесячных платежей.<br><br>Для планов на 3 и 6 месяцев договор является обязательным на весь выбранный срок. Если Клиент расторгает договор до полной оплаты всех платежей, применяется фиксированный штраф в качестве компенсации за уже выполненную работу, а оставшаяся сумма подлежит немедленной оплате.",

            clause3Title: "Приостановка и отключение услуг",
            clause3Body: "В случае просрочки ежемесячного платежа по плану на 3 или 6 месяцев на 5 календарных дней, либо несвоевременной оплаты оставшихся 50% по плану 50/50, Исполнитель (OSG) имеет право без предупреждения приостановить работы или полностью отключить сайт из интернет-пространства до полного погашения задолженности.",

            clause4Title: "Предоставление материалов и сроки проекта",
            clause4Body: "Клиент обязуется предоставить Исполнителю (OSG) все текстовые и визуальные материалы, необходимые для сайта, в согласованные сроки. Задержка предоставления материалов со стороны Клиента не приостанавливает сроки проекта и не влияет на отсчёт ежемесячных платежей.",

            clause5Title: "Объём работ и изменения",
            clause5Body: "Услуга включает только изначально согласованный функционал и дизайн. После утверждения проекта добавление любого нового функционала или структурных изменений считается отдельной услугой и подлежит дополнительной оплате. В свою очередь, Исполнитель (OSG) обязуется своевременно, в письменной форме, уведомлять Клиента о любой ожидаемой задержке согласованных сроков проекта, с указанием пересмотренной предполагаемой даты сдачи.",

            clause6Title: "Политика возврата средств",
            clause6Body: "После начала работы (разработки дизайна/кода), первоначальный 50%-ный аванс по плану 50/50, либо первый платёж по плану на 3 или 6 месяцев, не подлежит возврату, так как покрывает уже затраченные рабочие часы и ресурсы.",

            clause7Title: "Ограничение ответственности",
            clause7Body: "Исполнитель (OSG) не несёт ответственности за временные сбои в работе сайта, вызванные техническими неполадками сторонних сервисов (хостинг-провайдер, регистратор доменов, платёжные системы) или обстоятельствами непреодолимой силы (форс-мажор).",

            clause8Title: "Конфиденциальность данных",
            clause8Body: "OSG обеспечивает полную конфиденциальность контактной и деловой информации, предоставленной Клиентом, и обязуется не передавать её третьим лицам.",

            clause9Title: "Портфолио и маркетинг",
            clause9Body: "Исполнитель (OSG) имеет право использовать созданный сайт, его визуальные элементы и достигнутые результаты (кейсы) в собственном портфолио, социальных сетях и рекламных материалах, если между сторонами не заключено отдельное NDA (соглашение о конфиденциальности).",

            clause10Title: "Приём и передача проекта",
            clause10Body: "После передачи тестовой версии сайта у Клиента есть 5 рабочих дней для предоставления замечаний и указания недочётов. При отсутствии обратной связи в течение этого срока работа считается полностью и надлежащим образом выполненной.",

            clause11Title: "Гарантийный срок",
            clause11Body: "С момента запуска сайта в интернете OSG бесплатно устраняет выявленные технические неисправности и незначительные доработки в соответствии с выбранным пакетом:<br><br>Пакет Starter: 14 дней;<br>Пакет Pro: 21 день;<br>Пакет Premium: 3 месяца (90 дней).<br><br>По истечении указанных гарантийных сроков любая техническая поддержка, обновления или изменения осуществляются по отдельно согласованному тарифу.",

            footnote: "Последнее обновление: июль 2026 г. · Если у вас есть вопросы, свяжитесь с нами — <a href=\"mailto:osgbusiness01@gmail.com\">osgbusiness01@gmail.com</a>",

            footerAbout: "Бутик-студия премиум-класса, создающая цифровое присутствие для брендов, которым нужно совершенство.",
            footerContactTitle: "Контакты",
            footerSocialTitle: "Подпишитесь на нас",
            footerCopyright: "© 2026 OSG Digital Agency. Все права защищены.",
            footerTermsLink: "Условия использования"
        }
    };

    let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ka') ? 'ge' : (navigator.language.startsWith('ru') ? 'ru' : 'en'));

    const applyTranslations = (lang) => {
        if (!translations[lang]) return;

        if (translations[lang].pageTitle) {
            document.title = translations[lang].pageTitle;
        }

        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.getAttribute('data-lang');
            if (translations[lang][key] !== undefined) {
                element.innerHTML = translations[lang][key];
            }
        });
    };

    const updateLanguageSelector = (lang) => {
        const currentLangBtn = document.getElementById('current-lang-btn');
        if (currentLangBtn) {
            currentLangBtn.textContent = lang.toUpperCase();
        }
    };

    document.querySelectorAll('.language-options a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = e.currentTarget.getAttribute('data-lang-value');
            localStorage.setItem('lang', newLang);
            currentLang = newLang;
            applyTranslations(newLang);
            updateLanguageSelector(newLang);
            document.getElementById('language-options')?.classList.remove('active');
            document.getElementById('current-lang-btn')?.setAttribute('aria-expanded', 'false');
        });
    });

    document.getElementById('current-lang-btn')?.addEventListener('click', function () {
        const options = document.getElementById('language-options');
        options.classList.toggle('active');
        this.setAttribute('aria-expanded', options.classList.contains('active'));
    });

    document.addEventListener('click', (e) => {
        const currentLangBtn = document.getElementById('current-lang-btn');
        const languageOptions = document.getElementById('language-options');
        if (currentLangBtn && languageOptions && !currentLangBtn.contains(e.target) && !languageOptions.contains(e.target)) {
            languageOptions.classList.remove('active');
            currentLangBtn.setAttribute('aria-expanded', 'false');
        }
    });

    applyTranslations(currentLang);
    updateLanguageSelector(currentLang);
});
