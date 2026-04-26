document.addEventListener('DOMContentLoaded', () => {
    const bodyEl = document.body;
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const closeBtn = document.getElementById('close-mobile-menu');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    const openMobileMenu = () => bodyEl.classList.add('mobile-nav-is-open');
    const closeMobileMenu = () => bodyEl.classList.remove('mobile-nav-is-open');

    hamburgerBtn?.addEventListener('click', openMobileMenu);
    closeBtn?.addEventListener('click', closeMobileMenu);
    mobileNavOverlay?.addEventListener('click', closeMobileMenu);
    

    
    // ================================
    // SPA-LIKE NAVIGATION
    // ================================
    const SpaNavigator = {
        elements: {
            navLinks: document.querySelectorAll('.nav-link'),
            pageViews: document.querySelectorAll('.page-view'),
            mainContentView: document.getElementById('main-content-view'),
            body: document.body
        },
        scrollObserver: null,

        init() {
            this._bindEvents();
            this._setupScrollSpy();
            this._handleInitialLoad();
        },

        _bindEvents() {
            document.addEventListener('click', (e) => {
                const navLink = e.target.closest('.nav-link');
                if (!navLink) return;

                const targetId = navLink.hash;

                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();
                    const isMobileClick = e.target.closest('.mobile-nav-links');

                if (this.elements.body.classList.contains('mobile-nav-is-open')) {
                    closeMobileMenu();
                    setTimeout(() => this.switchView(targetId), 500);
                } else {
                    this.switchView(targetId);
                }


                }
            });

            window.addEventListener('popstate', (e) => {
                const targetId = e.state ? e.state.target : '#hero';
                this.switchView(targetId, true);
            });
        },

        switchView(targetId, isPopState = false, onComplete = null){
            if (!isPopState) {
                if(window.location.hash !== targetId) {
                   history.pushState({ target: targetId }, '', targetId);
                }
            }

            const isPageView = targetId.includes('-page');

            this.elements.pageViews.forEach(view => view.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active-link'));

            if (isPageView) {
                this.elements.body.style.overflow = 'hidden';
                this.elements.body.classList.add('virtual-page-active');
                const targetView = document.getElementById(targetId.substring(1) + '-view');
                if (targetView) targetView.classList.add('active');
                window.scrollTo(0, 0);
                if (typeof onComplete === 'function') {
                    setTimeout(onComplete, 50); 
                }
            } else {
                this.elements.body.style.overflow = '';
                this.elements.body.classList.remove('virtual-page-active');
                this.elements.mainContentView.classList.add('active');
                
                setTimeout(() => {
                    const targetSection = document.querySelector(targetId);
                    if (targetSection) {
                         const headerOffset = document.querySelector('header').offsetHeight;
                         const elementPosition = targetSection.getBoundingClientRect().top;
                         const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                         window.scrollTo({
                             top: offsetPosition,
                             behavior: 'smooth'
                         });
                    }
                }, 50);
            }

             document.querySelectorAll(`.nav-link[href="${targetId}"]`).forEach(link => link.classList.add('active-link'));
        },

        _setupScrollSpy() {
            const sections = this.elements.mainContentView.querySelectorAll('section[id]');
            const observerOptions = {
                rootMargin: "-20% 0px -50% 0px", 
                threshold: 0.01 
            };

            this.scrollObserver = new IntersectionObserver((entries) => {
                if (this.elements.body.classList.contains('virtual-page-active')) return;

                let activeEntry = null;
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        if (!activeEntry || entry.intersectionRatio > activeEntry.intersectionRatio) {
                            activeEntry = entry;
                        }
                    }
                }

                if (activeEntry) {
                    const activeSectionId = activeEntry.target.id;
                    const newHash = `#${activeSectionId}`;
                    
                    if (window.location.hash !== newHash) {
                       history.replaceState({ target: newHash }, '', newHash);
                    }
                    
                    document.querySelectorAll('.nav-links a, .mobile-nav-links a').forEach(link => {
                        const isActive = link.hash === newHash;
                        link.classList.toggle('active-link', isActive);
                    });
                }
            }, observerOptions);

            sections.forEach(section => this.scrollObserver.observe(section));
        },

        _handleInitialLoad() {
            const initialHash = window.location.hash || '#hero';
            this.switchView(initialHash, true);
        }
    };
    
    SpaNavigator.init();


    // ================================
    // AOS INIT
    // ================================
    AOS.init({ duration: 800, once: true, offset: 50 });

    // ================================
    // STAGGERED ANIMATION SETUP
    // ================================
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links li');
    mobileNavLinks.forEach((link, index) => {
        link.style.setProperty('--i', index);
    });

    // ================================
    // LANGUAGE SWITCHER
    // ================================
    const translations = {
        en: {
             proPackageLabel: "Pro Package", starterPackageLabel: "Starter Package", individualPayment: "Individual", individualTitle: "Custom Solution",individualPrice: "1700₾+",individualDesc: "Tell us about your project",individualFeature1: "Multi-page (10+) websites",individualFeature2: "E-commerce & Booking Systems",individualFeature3: "Advanced API Integrations",individualCardPrie: "The price is determined by the project complexity." ,monthlyPayment: "Monthly", monthlyPaymentBilling: "per month",    pricingStarterPriceMonthly: "55₾",     pricingProPriceMonthly: "115₾", pricingPremiumPriceMonthly: "185₾", salesTitle2: "+22% sales", sourceTitle2: "Source: Admin / GA4 • 45 day", webInfoTitle2: "Online Store · Performance · Launched: Apr 2025", viewPRTitle:"View Live Project",pageDescription: "OSG Agency creates professional, high-performance websites for businesses. We help local companies grow their digital presence and drive more sales.", pageTitle: "OSGWeb.ge - Websites That Grow Your Business", navServices: "Services", navPortfolio: "Portfolio", navTestimonials: "Testimonials", navPricing: "Pricing", navContact: "Contact", heroTitle: "Your Business,<br><span class='gradient-text'>Digitally</span>", heroSubtitle: "Websites That Work For You", heroButton: "Start a Project", servicesTitle: "Our Goal Is Your Success", service1Title: "Design", service1Desc: "A technically sound website is not enough — the visual impression decides whether the user stays. The design should be modern, easy to understand, and tailored to the brand.", service2Title: "Security", service2Desc: "User trust begins with website security. Modern protection mechanisms ensure defense against hacking attacks, data leaks, and other threats.", service3Title: "Easy Management", service3Desc: "An intuitive system lets you easily change texts, add images, and customize the site to your needs — without coding knowledge.", portfolioTitle: "Featured Works", portfolio1Title: "'The Golden Fork' - Restaurant Website", portfolio2Title: "'The Trim House' - Barbershop Branding", portfolio3Title: "'Olio & Sale' - Cafe Online Website", portfolio4Title:"'Healthy Salad' - Restaurant Website", testimonialsTitle: "Reviews and Testimonials", contactTitle: "Contact Us", contactInfoTitle: "Contact Information", contactInfoDesc: "Have a project or question? Write to us, call us, or fill out the form.", reviewPromptText: "Have you worked with us? We’d love to hear your feedback.", contactInfoLocation: "Tbilisi, Georgia", formNamePlaceholder: "Your Name",formFullNamePlaceholder: "Full Name", formEmailPlaceholder: "Your Email", formCompanyPlaceholder:"Company Name", formMessagePlaceholder: "Your Message", formWebsitePlaceholder:"Link of website", reviewFormMessagePlaceholder: "Write your review here...", formLogoPlaceholder: "Add company logo", formSendButton: "Send", formInterestMessage: "Hello, I am interested in the {planName} package.", footerAbout: "Innovative digital experience for brand success.", footerContactTitle: "Contact Us", footerSocialTitle: "Follow Us", footerCopyright: "© 2025 OSGWeb.ge. All rights reserved.", reviewPageTitle: "Leave a Review", reviewPageSubtitle: "Your feedback helps us become even better.", reviewFormSubmitButton: "Submit Review", reviewSuccessTitle: "Thank You!", reviewPendingMessage: "Your review will be published after we confirm your project.", pricingTitle: "Simple, Transparent Pricing", pricingStarterTitle: "Starter", pricingStarterPrice: "500₾", pricingStarterFeature1: "3-page website: Home, Menu, Contact",oneTimePaymentTitle: "One-time", oneTimePayment: "One-time payment", pricingStarterFeature2: "Fully responsive design", pricingStarterFeature3: "Clear and attractive design", pricingStarterFeature4: "SEO Basics", pricingStarterFeature5: "Fast Loading Speed", pricingProTitle: "Pro", pricingProPrice: "1050₾", pricingProFeature1: "5 pages: Includes Starter Pack pages +", pricingProFeature2: "Reservation functions", pricingProFeature3: "Reservation page", pricingProFeature4: "Admin panel", pricingProFeature5: "CMS Integration", pricingProFeature6: "Advanced Analytics", pricingPremiumTitle: "Premium", pricingPremiumPrice: "1700₾", pricingPremiumFeature1: "Up to 10 Pages & Custom Design", pricingPremiumFeature2: "Advanced CMS & Admin Panel", pricingPremiumFeature3: "E-commerce or Booking System", pricingPremiumFeature4: "Full SEO & Performance Optimization", pricingPremiumFeature5: "Priority Support & Training", pricingPremiumFeature6: "3 Months Post-Launch Maintenance", pricingMostPopular: "Most Popular", pricingGetStarted: "Get Started", pricingBookACall: "Book a Call", whatsappMessage: "Hello! I'd like to book a call to discuss your web services.", seeAllReviews: "See All Reviews", allReviewsTitle: "What Our Clients Say", backToHome: "← Back", noMoreReviews: "No more reviews", checkedTitle: "✓ Checked", webInfoTitle: "eCommerce · Stripe Checkout · Launched: May 2025", salesTitle:"+30% Sales", sourceTitle : "Source: GA4 • 60 day",
        },
        ge: {
            proPackageLabel: "პრო პაკეტი", starterPackageLabel: "სტარტერ პაკეტი", individualPayment: "ინდივ.",individualTitle: "სპეციალური შეკვეთა",individualPrice: "1700₾+",individualDesc: "მოგვიყევით პროექტზე.",individualFeature1: "10+ გვერდიანი ვებსაიტი",individualFeature2: "ელ. კომერცია და ჯავშნები",individualFeature3: "API-ს რთული ინტეგრაციები", individualCardPrie: "ფასი განისაზღვრება პროექტის სირთულის მიხედვით.", onthlyPayment: "ყოველთვიური", monthlyPayment: "თვიური", monthlyPaymentBilling: "თვეში", pricingStarterPriceMonthly: "55₾",pricingProPriceMonthly: "115₾",pricingPremiumPriceMonthly: "185₾", salesTitle2: "+22% გაყიდვები", sourceTitle2: "წყარო: Admin / GA4 • 45 დღე", webInfoTitle2: "ონლაინ მაღაზია · შესრულება · გამოშვების თარიღი: აპრ 2025", viewPRTitle:"პროექტის ნახვა",pageDescription: "OSG Agency ქმნის პროფესიონალურ, მაღალეფექტურ ვებ-გვერდებს ბიზნესისთვის. ჩვენ ვეხმარებით კომპანიებს ციფრული ცნობადობისა და გაყიდვების გაზრდაში.", pageTitle: "OSGWeb.ge - ვებსაიტები, რომელიც ბიზნესს ზრდის", navServices: "სერვისები", navPortfolio: "პორტფოლიო", navTestimonials: "შეფასებები", navPricing: "ფასები", navContact: "კონტაქტი", heroTitle: "შენი ბიზნესი,<br><span class='gradient-text'>ციფრულად</span>", heroSubtitle: "ვებსაიტები, რომლებიც მუშაობენ თქვენთვის", heroButton: "პროექტის დაწყება", servicesTitle: "ჩვენი მიზანია შენი წარმატება", service1Title: "დიზაინი", service1Desc: "ტექნიკურად გამართული საიტი საკმარისი არაა — ვიზუალური შთაბეჭდილება გადაწყვიტავს, დარჩება თუ არა მომხმარებელი. დიზაინი უნდა იყოს თანამედროვე, მარტივად აღსაქმელი და ბრენდზე მორგებული.", service2Title: "უსაფრთხოება", service2Desc: "მომხმარებლის ნდობა იწყება საიტის უსაფრთხოებით. თანამედროვე დაცვით მექანიზმებს უზრუნველყოფს ჰაკერული თავდასხმების, მონაცემთა გაჟონვის და სხვა საფრთხეებისგან დაცვას.", service3Title: "მარტივი მართვა", service3Desc: "ინტუიციური სისტემა საშუალებას გაძლევთ მარტივად შეცვალოთ ტექსტები, დაამატოთ სურათები და მოარგოთ საიტი თქვენს საჭიროებებს — კოდის ცოდნის გარეშე.", portfolioTitle: "გამორჩეული ნამუშევრები", portfolio1Title: "'The Golden Fork' - რესტორნის ვებსაიტი", portfolio4Title:"'Healthy Salad' - რესტორნის ვებსაიტი", portfolio2Title: "'The Trim House' - ბარბერშოპის ბრენდინგი", portfolio3Title: "'Olio & Sale' - კაფეს ონლაინ ვებსაიტი", testimonialsTitle: "მიმოხილვები და შეფასებები", reviewPromptText: "გვითანამშრომლია? სიამოვნებით მოვისმენთ თქვენს აზრს.", contactTitle: "დაგვიკავშირდით", contactInfoTitle: "საკონტაქტო ინფორმაცია", contactInfoDesc: "გაქვთ პროექტი ან შეკითხვა? მოგვწერეთ, დაგვირეკეთ, ან შეავსეთ ფორმა.", contactInfoLocation: "თბილისი, საქართველო",formFullNamePlaceholder: "სრული სახელი", formCompanyPlaceholder:"კომპანიის სახელი", formNamePlaceholder: "თქვენი სახელი",formWebsitePlaceholder:"ვებსაიტის ლინკი", reviewFormMessagePlaceholder:"დაწერეთ თქვენი შეფასება აქ...",formLogoPlaceholder:"კომპანიის ლოგო (სურვ.)", formEmailPlaceholder: "თქვენი ელ.ფოსტა", formMessagePlaceholder: "თქვენი შეტყობინება", formSendButton: "გაგზავნა", formInterestMessage: "გამარჯობა, დაინტერესებული ვარ {planName} პაკეტით.", footerAbout: "ინოვაციური ციფრული გამოცდილება ბრენდის წარმატებისთვის.", footerContactTitle: "კონტაქტი", footerSocialTitle: "გამოგვყევით", footerCopyright: "© 2025 OSGWeb.ge. ყველა უფლება დაცულია.", reviewPageTitle: "შეფასების დატოვება", reviewPageSubtitle: "თქვენი გამოხმაურება გვეხმარება გავხდეთ უკეთესები.", reviewFormSubmitButton: "შეფასების გაგზავნა", reviewSuccessTitle: "გმადლობთ!", reviewPendingMessage: "თქვენი შეფასება გამოქვეყნდება პროექტის დადასტურების შემდეგ.",oneTimePaymentTitle: "ერთჯერადი", oneTimePayment: "ერთჯერადი გადახდა", pricingTitle: "მარტივი, გამჭვირვალე ფასები", pricingStarterTitle: "სტარტერი", pricingStarterPrice: "500₾", pricingStarterFeature1: "3-გვერდიანი ვებსაიტი: მთავარი, მენიუ, კონტაქტი", pricingStarterFeature2: "სრულად ადაპტური დიზაინი", pricingStarterFeature3: "ნათელი და საუკეთესო დიზაინი", pricingStarterFeature4: "SEO საფუძვლები", pricingStarterFeature5: "ჩატვირთვის სწრაფი სიჩქარე", pricingProTitle: "პრო", pricingProPrice: "1050₾", pricingProFeature1: "5 გვერდი: მოიცავს Starter პაკეტის გვერდებს +", pricingProFeature2: "დაჯავშნის ფუნქციები", pricingProFeature3: "დაჯავშნის გვერდი", pricingProFeature4: "ადმინისტრატორის პანელი", pricingProFeature5: "CMS ინტეგრაცია", pricingProFeature6: "გაფართოებული ანალიტიკა", pricingPremiumTitle: "პრემიუმი", pricingPremiumPrice: "1700₾", pricingPremiumFeature1: "10-მდე გვერდი და უნიკალური დიზაინი", pricingPremiumFeature2: "გაფართოებული CMS და ადმინ. პანელი", pricingPremiumFeature3: "ელ.კომერციის ან დაჯავშნის სისტემა", pricingPremiumFeature4: "სრული SEO და წარმადობის ოპტიმიზაცია", pricingPremiumFeature5: "პრიორიტეტული მხარდაჭერა და ტრენინგი", pricingPremiumFeature6: "გაშვების შემდგომი 3 თვიანი მხარდაჭერა", pricingMostPopular: "პოპულარული", pricingGetStarted: "დაწყება", pricingBookACall: "ზარის დაჯავშნა", whatsappMessage: "გამარჯობა, მსურს ზარის დაჯავშნა თქვენს ვებ-გვერდის სერვისებზე სასაუბროდ.", seeAllReviews: "ყველა შეფასების ნახვა", allReviewsTitle: "რას ამბობენ კლიენტები", backToHome: "← უკან",    noMoreReviews: "მეტი შეფასება არ არის", checkedTitle: "✓ შემოწმებული", webInfoTitle: "eCommerce · Stripe Checkout · გამოშვების თარიღი: მაისი 2025", salesTitle:"+30% გაყიდვები", sourceTitle : "წყარო: GA4 • 60 დღე", 
        },
        ru: { 
            proPackageLabel: "Пакет Pro", starterPackageLabel: "Пакет Стартовый", individualPayment: "Индив.",individualTitle: "Индивидуальный проект",individualPrice: "1700₾+",individualDesc: "Расскажите нам о проекте",individualFeature1: "Многостраничные (10+) сайты",individualFeature2: "E-commerce и системы бронирования",individualFeature3: "Сложные API-интеграции", individualCardPrie: "Цена определяется сложностью проекта." ,monthlyPayment: "Ежемесячный", monthlyPaymentBilling: "в месяц", pricingStarterPriceMonthly: "55₾",pricingProPriceMonthly: "115₾",pricingPremiumPriceMonthly: "185₾", salesTitle2: "+22% продажи", sourceTitle2: "источник: Admin / GA4 • 45 день", webInfoTitle2: "Интернет-магазин · Производительность · Запуск: апр 2025", viewPRTitle:"просмотреть проект",pageDescription: "Диджитал-агентство OSG создает профессиональные и высокоэффективные веб-сайты для бизнеса. Мы помогаем компаниям развивать цифровое присутствие и увеличивать продажи.", pageTitle: "OSGWeb.ge - Сайты, развивающие ваш бизнес", navServices: "Услуги", navPortfolio: "Портфолио", navTestimonials: "Отзывы", navPricing: "Цены", navContact: "Контакты", heroTitle: "Ваш бизнес,<br><span class='gradient-text'>в цифре</span>", heroSubtitle: "Сайты, которые работают на вас", heroButton: "Начать проект", servicesTitle: "Наша цель – ваш успех", service1Title: "Дизайн", service1Desc: "Технически совершенного сайта недостаточно — визуальное впечатление решает, останется ли пользователь. Дизайн должен быть современным, понятным и адаптированным под бренд.", service2Title: "Безопасность", service2Desc: "Доверие пользователей начинается с безопасности сайта. Современные механизмы защиты обеспечивают отражение хакерских атак, утечек данных и других угроз.", service3Title: "Простое управление", service3Desc: "Интуитивно понятная система позволяет легко изменять тексты, добавлять изображения и настраивать сайт под свои нужды — без знаний кодирования.", portfolioTitle: "Избранные работы", portfolio1Title: "'Золотая Вилка' - Сайт ресторана", portfolio2Title: "'Дом Стрижки' - Брендинг барбершопа", portfolio3Title: "'Олио и Сале' - Онлайн-сайт кафе",  portfolio4Title:"'полезный салат' - Сайт ресторана",testimonialsTitle: "Отзывы и рекомендации", contactTitle: "Свяжитесь с нами", contactInfoTitle: "Контактная информация", contactInfoDesc: "Есть проект или вопрос? Напишите нам, позвоните или заполните форму.", reviewPromptText: "Работали с нами? Мы будем рады вашему отзыву.", contactInfoLocation: "Тбилиси, Грузия", formNamePlaceholder: "Ваше имя", formEmailPlaceholder: "Ваш email", formMessagePlaceholder: "Ваше сообщение", formSendButton: "Отправить", formFullNamePlaceholder: "полное имя", formCompanyPlaceholder:"Название компании",formWebsitePlaceholder:"Ссылка на сайт", reviewFormMessagePlaceholder: "Оставьте свой отзыв здесь...", formLogoPlaceholder:"Логотип компании (по жел.)", formInterestMessage: "Здравствуйте, я заинтересован в пакете {planName}.", footerAbout: "Инновационный цифровой опыт для успеха бренда.", footerContactTitle: "Свяжитесь с нами", footerSocialTitle: "Подпишитесь на нас", footerCopyright: "© 2025 OSGWeb.ge. Все права защищены.", reviewPageTitle: "Оставить отзыв", reviewPageSubtitle: "Ваш отзыв помогает нам стать еще лучше.", reviewFormSubmitButton: "Отправить отзыв", reviewSuccessTitle: "Спасибо!", reviewPendingMessage: "Ваш отзыв будет опубликован после подтверждения вашего проекта.", pricingTitle: "Простые, прозрачные цены", pricingStarterTitle: "Стартовый", pricingStarterPrice: "500₾", oneTimePayment: "Разовый платеж",oneTimePaymentTitle: "Разовый", pricingStarterFeature1: "3-страничный сайт: Главная, Меню, Контакты", pricingStarterFeature2: "Полностью адаптивный дизайн", pricingStarterFeature3: "Чистый и крутой дизайн", pricingStarterFeature4: "Основы SEO", pricingStarterFeature5: "Быстрая скорость загрузки", pricingProTitle: "Профессиональный", pricingProPrice: "1050₾", pricingProFeature1: "5 страниц: включает страницы стартового пакета +", pricingProFeature2: "Функции бронирования", pricingProFeature3: "Страница бронирования", pricingProFeature4: "Панель администратора", pricingProFeature5: "Интеграция CMS", pricingProFeature6: "Расширенная аналитика", pricingPremiumTitle: "Премиум", pricingPremiumPrice: "1700₾", pricingPremiumFeature1: "До 10 страниц и индивидуальный дизайн", pricingPremiumFeature2: "Расширенная CMS и панель администратора", pricingPremiumFeature3: "Система электронной коммерции или бронирования", pricingPremiumFeature4: "Полная SEO и оптимизация производительности", pricingPremiumFeature5: "Приоритетная поддержка и обучение", pricingPremiumFeature6: "3 месяца поддержки после запуска", pricingMostPopular: "популярный", pricingGetStarted: "Начать", pricingBookACall: "Заказать звонок", whatsappMessage: "Здравствуйте, я хотел бы заказать звонок, чтобы обсудить ваши услуги по веб-разработке.", seeAllReviews: "Посмотреть все отзывы",   allReviewsTitle: "Что говорят наши клиенты", backToHome: "← Назад",         noMoreReviews: "Больше отзывов нет", checkedTitle: "✓ Проверено",  webInfoTitle: "eCommerce · Stripe Checkout · Дата выхода: май 2025 г.", salesTitle:"+30% Продажи", sourceTitle : "источник: GA4 • 60 день",
        }
    };

    let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ka') ? 'ge' : (navigator.language.startsWith('ru') ? 'ru' : 'en'));
    let currentBillingPeriod = 'onetime';

    
const applyTranslations = (lang) => {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            if (!element.hasAttribute('data-price-point') && !element.hasAttribute('data-billing-period')) {
                element.innerHTML = translations[lang][key];
            }
        }
    });

    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    document.querySelectorAll('[data-lang-meta]').forEach(element => {
        const key = element.getAttribute('data-lang-meta');
        if (translations[lang] && translations[lang][key]) {
            element.setAttribute('content', translations[lang][key]);
        }
    });

    document.querySelectorAll('.pricing-card').forEach(card => {
        const planId = card.getAttribute('data-plan-id');
        const priceEl = card.querySelector('[data-price-point]');
        const periodEl = card.querySelector('[data-billing-period]');
        
        const priceKey = `pricing${planId}Price${currentBillingPeriod === 'monthly' ? 'Monthly' : ''}`;
        const periodKey = currentBillingPeriod === 'monthly' ? 'monthlyPaymentBilling' : 'oneTimePayment';
        
        if (priceEl && translations[lang][priceKey]) {
            priceEl.textContent = translations[lang][priceKey];
        }
        if (periodEl && translations[lang][periodKey]) {
            periodEl.textContent = translations[lang][periodKey];
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
            const newLang = e.target.getAttribute('data-lang-value');
            localStorage.setItem('lang', newLang);
            currentLang = newLang;
            applyTranslations(newLang);
            updateLanguageSelector(newLang);
            document.getElementById('language-options').classList.remove('active');
        });
    });

    document.querySelectorAll('.mobile-lang-switcher button').forEach(button => {
        button.addEventListener('click', (e) => {
            const newLang = e.target.getAttribute('data-lang-value');
            localStorage.setItem('lang', newLang);
            currentLang = newLang;
            applyTranslations(newLang);
            updateLanguageSelector(newLang);
            closeMobileMenu();
        });
    });

    document.getElementById('current-lang-btn')?.addEventListener('click', function() {
        const options = document.getElementById('language-options');
        options.classList.toggle('active');
        this.setAttribute('aria-expanded', options.classList.contains('active'));
    });

    document.addEventListener('click', (e) => {
        const currentLangBtn = document.getElementById('current-lang-btn');
        const languageOptions = document.getElementById('language-options');
        if (currentLangBtn && languageOptions && !currentLangBtn.contains(e.target) && !languageOptions.contains(e.target)) {
            languageOptions.classList.remove('active');
            currentLangBtn.setAttribute('aria-expanded', false);
        }
    });

    applyTranslations(currentLang);
    updateLanguageSelector(currentLang);


    // ================================
    // "GET STARTED" BUTTON LOGIC
    // ================================
    document.querySelectorAll('.get-started-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            const plan = button.getAttribute('data-plan'); 
            let planTitleKey;
            switch(plan) {
                case 'Starter': planTitleKey = 'pricingStarterTitle'; break;
                case 'Pro': planTitleKey = 'pricingProTitle'; break;
                case 'Premium': planTitleKey = 'pricingPremiumTitle'; break;
            }
            
            const planName = translations[currentLang][planTitleKey] || plan;
            const messageTemplate = translations[currentLang].formInterestMessage;

            const finalMessage = messageTemplate.replace('{planName}', planName);
            
            const contactTextarea = document.getElementById('contact-message');
            if (contactTextarea) {
                contactTextarea.value = finalMessage;
            }

            if (document.body.classList.contains('mobile-nav-is-open')) {
                closeMobileMenu();
                setTimeout(() => {
                    SpaNavigator.switchView('#contact-page', false, () => {
                        document.getElementById('contact-message')?.focus();
                    });
                }, 500);
            } else {
                SpaNavigator.switchView('#contact-page', false, () => {
                    document.getElementById('contact-message')?.focus();
                });
            }
        });
    });

    
      // ===================================
    // NEW & IMPROVED PRICING TOGGLE LOGIC
    // ===================================
    const billingToggleButtons = document.querySelectorAll('.toggle-btn');
    const pricingCards = document.querySelectorAll('.pricing-card');

const handleBillingToggle = (e) => {
    const selectedPeriod = e.currentTarget.getAttribute('data-period');
    if (selectedPeriod === currentBillingPeriod) return;

    currentBillingPeriod = selectedPeriod;

    const pricingGrid = document.querySelector('.pricing-cards-grid');
    const standardCards = document.querySelectorAll('.pricing-card:not(.individual-plan)');
    const individualCard = document.querySelector('.pricing-card.individual-plan');

    billingToggleButtons.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    if (currentBillingPeriod === 'individual') {
        pricingGrid.classList.add('individual-mode');
        standardCards.forEach(card => card.classList.add('hidden'));
        individualCard.classList.remove('hidden');
    } else {
        pricingGrid.classList.remove('individual-mode');
        standardCards.forEach(card => card.classList.remove('hidden'));
        individualCard.classList.add('hidden');
        
        standardCards.forEach(card => {
            const planId = card.getAttribute('data-plan-id');
            const priceEl = card.querySelector('[data-price-point]');
            const periodEl = card.querySelector('[data-billing-period]');
            
            const priceKey = `pricing${planId}Price${currentBillingPeriod === 'monthly' ? 'Monthly' : ''}`;
            const periodKey = currentBillingPeriod === 'monthly' ? 'monthlyPaymentBilling' : 'oneTimePayment';
            
            priceEl.textContent = translations[currentLang][priceKey];
            periodEl.textContent = translations[currentLang][periodKey];
        });
    }
};

  

    billingToggleButtons.forEach(button => {
        button.addEventListener('click', handleBillingToggle);
    });


    // ===================================
    // REVIEW FORM - LOGO UPLOAD PREVIEW
    // ===================================
    const logoUploadInput = document.getElementById('review-logo');
    const logoUploadWrapper = document.getElementById('logo-upload-wrapper');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    if (logoUploadInput && logoUploadWrapper && imagePreview && removeImageBtn) {
        
        logoUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreview.src = event.target.result;
                    logoUploadWrapper.classList.add('preview-visible');
                }
                reader.readAsDataURL(file);
            }
        });

        removeImageBtn.addEventListener('click', function() {
            logoUploadInput.value = null;
            logoUploadWrapper.classList.remove('preview-visible');
            
            imagePreview.src = '#';
        });
    }



    document.getElementById("book-a-call-link").addEventListener("click", function(e) {
    e.preventDefault();
    window.open("https://wa.me/995555095959?call", "_blank");
});


    


    applyTranslations(currentLang);
// ================================
// PORTFOLIO CAROUSEL
// ================================
const initPortfolioCarousel = () => {
    const track = document.querySelector('.carousel-track');
    const items = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.carousel-btn--prev');
    const nextBtn = document.querySelector('.carousel-btn--next');
    const dotsContainer = document.querySelector('.carousel-dots');

    if (!track || !items.length) return;

    let currentIndex = 0;
    const total = items.length;

    // --- Build dots ---
    items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('aria-label', `Go to project ${i + 1}`);
        if (i === 0) dot.classList.add('is-active');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.carousel-dot');

    const getItemWidth = () => {
        const item = items[0];
        const style = getComputedStyle(track);
        const gap = parseFloat(style.gap) || 0;
        return item.getBoundingClientRect().width + gap;
    };

const goTo = (index) => {
    currentIndex = Math.max(0, Math.min(index, total - 1));

    const wrapperWidth = track.parentElement.offsetWidth;
    const itemWidth = items[currentIndex].offsetWidth;
    
    const gap = parseFloat(getComputedStyle(track).gap) || 0;

    const offset = (currentIndex * (itemWidth + gap)) - (wrapperWidth / 2) + (itemWidth / 2);

    track.style.transform = `translateX(${-offset}px)`;

    items.forEach((item, i) => {
        item.classList.toggle('is-active', i === currentIndex);
    });

    if (dots.length) {
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === currentIndex);
        });
    }

    prevBtn.style.opacity = currentIndex === 0 ? "0" : "1";
    prevBtn.style.pointerEvents = currentIndex === 0 ? "none" : "auto";
    
    nextBtn.style.opacity = currentIndex === total - 1 ? "0" : "1";
    nextBtn.style.pointerEvents = currentIndex === total - 1 ? "none" : "auto";
};

    prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
    nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

    document.addEventListener('keydown', (e) => {
        const portfolioSection = document.getElementById('portfolio');
        if (!portfolioSection) return;
        const rect = portfolioSection.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;

        if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
        if (e.key === 'ArrowRight') goTo(currentIndex + 1);
    });

    let touchStartX = 0;
    let touchDelta = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchDelta = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(touchDelta) > 50) {
            touchDelta > 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
        }
    }, { passive: true });

    window.addEventListener('resize', () => goTo(currentIndex));

    goTo(0);
};

initPortfolioCarousel();
});






