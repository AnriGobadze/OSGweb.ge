document.addEventListener('DOMContentLoaded', () => {
    const bodyEl = document.body;
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    const openMobileMenu = () => {
        bodyEl.classList.add('mobile-nav-is-open');
        hamburgerBtn?.setAttribute('aria-expanded', 'true');
        hamburgerBtn?.setAttribute('aria-label', 'Close menu');
    };
    const closeMobileMenu = () => {
        bodyEl.classList.remove('mobile-nav-is-open');
        hamburgerBtn?.setAttribute('aria-expanded', 'false');
        hamburgerBtn?.setAttribute('aria-label', 'Open menu');
    };
    const toggleMobileMenu = () => {
        bodyEl.classList.contains('mobile-nav-is-open') ? closeMobileMenu() : openMobileMenu();
    };

    hamburgerBtn?.addEventListener('click', toggleMobileMenu);
    mobileNavOverlay?.addEventListener('click', closeMobileMenu);

    // ================================
    // QUICK-JUMP SCROLL
    // GSAP's ScrollToPlugin drives in-page navigation instead of native
    // `behavior:'smooth'` — a fast, fixed 0.5s duration with an
    // out-easing curve reads as an immediate jump with a soft, elegant
    // finish, rather than the long full-distance glide native smooth
    // scroll produces on longer jumps (e.g. hero -> contact).
    // ================================
    const prefersReducedMotionScroll = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
    }

    function quickJumpTo(targetY) {
        if (prefersReducedMotionScroll || typeof gsap === 'undefined' || typeof ScrollToPlugin === 'undefined') {
            window.scrollTo(0, targetY);
            return;
        }

        gsap.killTweensOf(window);
        gsap.to(window, {
            duration: 0.5,
            ease: 'power4.out',
            scrollTo: { y: targetY }
        });
    }


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
        lastSectionHash: null,

        init() {
            this._bindEvents();
            this._setupScrollSpy();
            this._handleInitialLoad();
        },

        _bindEvents() {
            document.addEventListener('click', (e) => {
                const navLink = e.target.closest('.nav-link');
                if (!navLink) return;

                // Back-links (e.g. inside the contact page) return to whichever
                // section the user actually came from — which package they'd
                // clicked "get started" on — instead of their static href.
                const targetId = (navLink.classList.contains('back-link') && this.lastSectionHash)
                    ? this.lastSectionHash
                    : navLink.hash;

                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();

                    if (this.elements.body.classList.contains('mobile-nav-is-open')) {
                        closeMobileMenu();
                    }
                    this.switchView(targetId);
                }
            });

            window.addEventListener('popstate', (e) => {
                const targetId = e.state ? e.state.target : '#hero';
                this.switchView(targetId, true);
            });
        },

        switchView(targetId, isPopState = false, onComplete = null){
            const isPageView = targetId.includes('-page');

            // Remember the section we're leaving so a later back-link click can
            // return here, rather than always landing on the hero.
            if (isPageView && !isPopState) {
                const currentHash = window.location.hash || '#hero';
                if (!currentHash.includes('-page')) {
                    this.lastSectionHash = currentHash;
                }
            }

            if (!isPopState) {
                if(window.location.hash !== targetId) {
                   history.pushState({ target: targetId }, '', targetId);
                }
            }

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
                         quickJumpTo(offsetPosition);
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
            proPackageLabel: "Pro Package", starterPackageLabel: "Starter Package",
            badgeEyebrow: "✦ CURRENTLY ACCEPTING ✦", badgeHeadline: "Only&nbsp;2&nbsp;Premium<br>Projects", badgeSub: "For July 2026",

            individualPayment: "Individual", individualTitle: "Custom Solution", individualPrice: "Custom Quote", individualDesc: "Tell us about your project",
            individualFeature1: "Multi-page (10+) websites", individualFeature2: "E-commerce & Booking Systems", individualFeature3: "Advanced API Integrations",
            individualCardPrie: "The price is determined by the project complexity.",

            salesTitle2: "+22% sales", sourceTitle2: "Source: Admin / GA4 • 45 day", webInfoTitle2: "<span class=\"case-tag-prefix\">Online Store · Performance · </span>Launched: Apr 2025", viewPRTitle: "View Live Project",

            pageDescription: "OSG is a boutique web development and UI/UX design studio building high-performance digital platforms for ambitious brands. No templates, pure custom engineering.",
            pageTitle: "Custom Web Development & UI/UX Design Studio | OSG",

            navServices: "Services", navPortfolio: "Portfolio", navTestimonials: "Testimonials", navPricing: "Pricing", navContact: "Contact",
            heroTitle: "Your Business,<br><span class='gradient-text'>Digitally.</span>", heroSubtitle: "Websites That Work For You", heroButton: "Start a Project <i class=\"fas fa-chevron-right\" aria-hidden=\"true\"></i>", heroButtonSecondary: "Explore Services",

            servicesTitle: "Our Goal Is Your Success",
            service1Title: "Design", service1Desc: "A technically sound website is not enough — the visual impression decides whether the user stays. The design should be modern, easy to understand, and tailored to the brand.",
            service2Title: "Security", service2Desc: "User trust begins with website security. Modern protection mechanisms ensure defense against hacking attacks, data leaks, and other threats.",
            service3Title: "Easy Management", service3Desc: "An intuitive system lets you easily change texts, add images, and customize the site to your needs — without coding knowledge.",

            portfolioTitle: "Featured Works",
            flagship1Title: "'Jagi Building' - Construction Website", flagship2Title: "'Laptop Georgia' - Tech Repair Website", flagship3Title: "'Stilis Sivrce' - Clothing Store Website", flagship4Title: "'Terra 24' - Funeral Bureau Website",
            flagship5Title: "'Prime Grind' - Construction Website", flagship6Title: "'Skhila Diesel Motors' - Car Care Website", flagship7Title: "'La Arté' - Jewellery Website", flagship8Title: "'EVAKUATORIGZAZE' - Tow Truck Website",
            portfolio1Title: "'The Golden Fork' - Restaurant Website", portfolio2Title: "'The Trim House' - Barbershop Branding", portfolio3Title: "'Olio & Sale' - Cafe Online Website",
            portfolio4Title: "'Healthy Salad' - Restaurant Website", portfolio5Title: "'Naxus AI' - Corporate Tech Website",

            testimonialsTitle: "Reviews and Testimonials", contactTitle: "Contact Us", contactInfoTitle: "Contact Information",
            contactInfoDesc: "Have a project or question? Write to us, call us, or fill out the form.",
            reviewPromptText: "Have you worked with us? We’d love to hear your feedback.", contactInfoLocation: "Tbilisi, Georgia",

            formNamePlaceholder: "Your Name", formFullNamePlaceholder: "Full Name", formEmailPlaceholder: "Your Email", formCompanyPlaceholder: "Company Name",
            formMessagePlaceholder: "Your Message", formWebsitePlaceholder: "Link of website", reviewFormMessagePlaceholder: "Write your review here...", reviewFormRatingLabel: "Your Rating",
            formLogoPlaceholder: "Add company logo", formSendButton: "Send", formInterestMessage: "Hello, I am interested in the {planName} package.",

            footerAbout: "A top 1% boutique studio engineering digital presence for brands that demand excellence.",
            footerContactTitle: "Contact Us", footerSocialTitle: "Follow Us", footerCopyright: "© 2026 OSG Digital Agency. All Rights Reserved.", footerTerms: "Terms of Service",

            reviewPageTitle: "Leave a Review", reviewPageSubtitle: "Your feedback helps us become even better.", reviewFormSubmitButton: "Submit Review",
            reviewSuccessTitle: "Thank You!", reviewPendingMessage: "Your review will be published after we confirm your project.",

            pricingTitle: "Simple, Transparent Pricing",

            oneTimePaymentTitle: "One-time", oneTimePayment: "One-time payment",

            groupInfrastructure: "Digital Infrastructure", groupPerformanceSeo: "Performance & SEO",
            groupAutomation: "Automation & Experience", groupEnterpriseSupport: "Enterprise Support",
            pricingProInclLabel: "Includes All Starter Tier Capabilities +", pricingPremiumInclLabel: "Includes All Pro Tier Capabilities +",

            pricingStarterTitle: "Starter", pricingStarterPrice: "1,200₾",
            pricingStarterFeature1: "Custom Multi-Section Digital Infrastructure (Up to 3 high-fidelity pages)",
            pricingStarterFeature2: "Bespoke User Experience (UX) & Luxury Visual Architecture",
            pricingStarterFeature3: "Blazing-Fast Performance Optimization (95+ Google PageSpeed Score)",
            pricingStarterFeature4: "Core Search Engine Optimization (SEO)",

paymentPlansTitle: "Payment Plans",
plan5050Title: "50/50",
plan3moTitle: "3-Month",
plan6moTitle: "6-Month",
plan5050Period: "50% Upfront / 50% at Launch",
plan3moPeriod: "3 monthly payments\n(+15% fee)",
plan6moPeriod: "6 monthly payments\n(+25% fee)",

pricingStarterPrice5050: "600₾", pricingStarterPrice3mo: "460", pricingStarterPrice6mo: "250₾",
pricingProPrice5050: "1250", pricingProPrice3mo: "955", pricingProPrice6mo: "520",
pricingPremiumPrice5050: "2600", pricingPremiumPrice3mo: "1990", pricingPremiumPrice6mo: "630",


            pricingProTitle: "Pro", pricingProPrice: "2,500₾", 
            pricingProFeature1: "Up to 5 Custom High-Conversion Pages",
            pricingProFeature2: "Advanced Admin & Analytics Dashboard",
            pricingProFeature3: "Dynamic CMS Integration (Supabase / Headless)",
            pricingProFeature4: "Fluid Modern Micro-Animations & Interactions",

            pricingPremiumTitle: "Premium", pricingPremiumPrice: "5,200₾", 
            pricingPremiumFeature1: "Up to 10 Pages & Enterprise Custom Architecture",
            pricingPremiumFeature2: "Advanced E-commerce / Custom Booking Engine",
            pricingPremiumFeature3: "Comprehensive Technical & On-Page SEO Audit",
            pricingPremiumFeature4: "Priority 24/7 Dedicated Line & 3 Months Post-Launch Maintenance",

            pricingMostPopular: "Most Popular", pricingGetStarted: "Get Started", pricingBookACall: "Book a Call",
            whatsappMessage: "Hello! I'd like to book a call to discuss your web services.",

            seeAllReviews: "See All Reviews", allReviewsTitle: "What Our Clients Say", backToHome: "← Back", noMoreReviews: "No more reviews",
            checkedTitle: "✓ Checked", webInfoTitle: "<span class=\"case-tag-prefix\">eCommerce · Stripe Checkout · </span>Launched: May 2025", salesTitle: "+30% Sales", sourceTitle: "Source: GA4 • 60 day",
        },
        ge: {
            proPackageLabel: "პრო პაკეტი", starterPackageLabel: "სტარტერ პაკეტი",
            badgeEyebrow: "✦ ამჟამად ვიღებთ ✦", badgeHeadline: "მხოლოდ&nbsp;2&nbsp;პრემიუმ<br>პროექტს", badgeSub: "2026 წლის ივლისისთვის",

            individualPayment: "ინდივ.", individualTitle: "სპეციალური შეკვეთა", individualPrice: "ინდივიდუალური შეთავაზება", individualDesc: "მოგვიყევით პროექტზე.",
            individualFeature1: "10+ გვერდიანი ვებსაიტი", individualFeature2: "ელ. კომერცია და ჯავშნები", individualFeature3: "API-ს რთული ინტეგრაციები",
            individualCardPrie: "ფასი განისაზღვრება პროექტის სირთულის მიხედვით.",

        

            salesTitle2: "+22% გაყიდვები", sourceTitle2: "წყარო: Admin / GA4 • 45 დღე", webInfoTitle2: "<span class=\"case-tag-prefix\">ონლაინ მაღაზია · შესრულება · </span>გამოშვების თარიღი: აპრ 2025", viewPRTitle: "პროექტის ნახვა",

            pageDescription: "OSG Digital Agency — ბუტიკ ვებ სტუდია. ვქმნით მორგებულ, მაღალხარისხიან ციფრულ პლატფორმებს და ვებსაიტებს ბიზნესებისთვის.",
            pageTitle: "ვებსაიტების დამზადება და UI/UX დიზაინი | OSG",

            navServices: "სერვისები", navPortfolio: "პორტფოლიო", navTestimonials: "შეფასებები", navPricing: "ფასები", navContact: "კონტაქტი",
            heroTitle: "შენი ბიზნესი,<br><span class='gradient-text'>ციფრულად.</span>", heroSubtitle: "ვებსაიტები, რომლებიც მუშაობენ თქვენთვის", heroButton: "პროექტის დაწყება <i class=\"fas fa-chevron-right\" aria-hidden=\"true\"></i>", heroButtonSecondary: "სერვისების ნახვა",

            servicesTitle: "ჩვენი მიზანია შენი წარმატება",
            service1Title: "დიზაინი", service1Desc: "ტექნიკურად გამართული საიტი საკმარისი არაა — ვიზუალური შთაბეჭდილება გადაწყვიტავს, დარჩება თუ არა მომხმარებელი. დიზაინი უნდა იყოს თანამედროვე, მარტივად აღსაქმელი და ბრენდზე მორგებული.",
            service2Title: "უსაფრთხოება", service2Desc: "მომხმარებლის ნდობა იწყება საიტის უსაფრთხოებით. თანამედროვე დაცვით მექანიზმებს უზრუნველყოფს ჰაკერული თავდასხმების, მონაცემთა გაჟონვის და სხვა საფრთხეებისგან დაცვას.",
            service3Title: "მარტივი მართვა", service3Desc: "ინტუიციური სისტემა საშუალებას გაძლევთ მარტივად შეცვალოთ ტექსტები, დაამატოთ სურათები და მოარგოთ საიტი თქვენს საჭიროებებს — კოდის ცოდნის გარეშე.",

            portfolioTitle: "გამორჩეული ნამუშევრები",
            flagship1Title: "'Jagi Building' - სამშენებლო კომპანიის ვებსაიტი", flagship2Title: "'Laptop Georgia' - ტექნიკის შეკეთების ვებსაიტი", flagship3Title: "'Stilis Sivrce' - ტანსაცმლის მაღაზიის ვებსაიტი", flagship4Title: "'Terra 24' - სარიტუალო ბიუროს ვებსაიტი",
            flagship5Title: "'Prime Grind' - სამშენებლო კომპანიის ვებსაიტი", flagship6Title: "'Skhila Diesel Motors' - ავტოსერვისის ვებსაიტი", flagship7Title: "'La Arté' - საიუველირო ვებსაიტი", flagship8Title: "'EVAKUATORIGZAZE' - ევაკუატორის სერვისის ვებსაიტი",
            portfolio1Title: "'The Golden Fork' - რესტორნის ვებსაიტი", portfolio4Title: "'Healthy Salad' - რესტორნის ვებსაიტი", portfolio5Title: "'Naxus AI' - კორპორატიული ტექნოლოგიური ვებსაიტი",
            portfolio2Title: "'The Trim House' - ბარბერშოპის ბრენდინგი", portfolio3Title: "'Olio & Sale' - კაფეს ონლაინ ვებსაიტი",

            testimonialsTitle: "მიმოხილვები და შეფასებები", reviewPromptText: "გვითანამშრომლია? სიამოვნებით მოვისმენთ თქვენს აზრს.",
            contactTitle: "დაგვიკავშირდით", contactInfoTitle: "საკონტაქტო ინფორმაცია", contactInfoDesc: "გაქვთ პროექტი ან შეკითხვა? მოგვწერეთ, დაგვირეკეთ, ან შეავსეთ ფორმა.",
            contactInfoLocation: "თბილისი, საქართველო",

            formFullNamePlaceholder: "სრული სახელი", formCompanyPlaceholder: "კომპანიის სახელი", formNamePlaceholder: "თქვენი სახელი", formWebsitePlaceholder: "ვებსაიტის ლინკი",
            reviewFormMessagePlaceholder: "დაწერეთ თქვენი შეფასება აქ...", reviewFormRatingLabel: "თქვენი შეფასება", formLogoPlaceholder: "კომპანიის ლოგო (სურვ.)", formEmailPlaceholder: "თქვენი ელ.ფოსტა",
            formMessagePlaceholder: "თქვენი შეტყობინება", formSendButton: "გაგზავნა", formInterestMessage: "გამარჯობა, დაინტერესებული ვარ {planName} პაკეტით.",

            footerAbout: "ინოვაციური ციფრული გამოცდილება ბრენდის წარმატებისთვის.",
            footerContactTitle: "კონტაქტი", footerSocialTitle: "გამოგვყევით", footerCopyright: "© 2026 OSG Digital Agency. ყველა უფლება დაცულია.", footerTerms: "წესები და პირობები",

            reviewPageTitle: "შეფასების დატოვება", reviewPageSubtitle: "თქვენი გამოხმაურება გვეხმარება გავხდეთ უკეთესები.", reviewFormSubmitButton: "შეფასების გაგზავნა",
            reviewSuccessTitle: "გმადლობთ!", reviewPendingMessage: "თქვენი შეფასება გამოქვეყნდება პროექტის დადასტურების შემდეგ.",

            oneTimePaymentTitle: "ერთჯერადი", oneTimePayment: "ერთჯერადი გადახდა", pricingTitle: "მარტივი, გამჭვირვალე ფასები",

            groupInfrastructure: "ციფრული ინფრასტრუქტურა", groupPerformanceSeo: "წარმადობა და SEO",
            groupAutomation: "ავტომატიზაცია და გამოცდილება", groupEnterpriseSupport: "საწარმოო დონის მხარდაჭერა",
            pricingProInclLabel: "მოიცავს Starter პაკეტის ყველა შესაძლებლობას +", pricingPremiumInclLabel: "მოიცავს Pro პაკეტის ყველა შესაძლებლობას +",

            pricingStarterTitle: "სტარტერი", pricingStarterPrice: "1,200₾",
            pricingStarterFeature1: "მორგებული მრავალსექციური ციფრული ინფრასტრუქტურა (მაქსიმუმ 3 მაღალი ხარისხის გვერდი)",
            pricingStarterFeature2: "ინდივიდუალური მომხმარებლის გამოცდილება (UX) და დახვეწილი ვიზუალური არქიტექტურა",
            pricingStarterFeature3: "მაქსიმალურად სწრაფი წარმადობის ოპტიმიზაცია (Google PageSpeed 95+ ქულა)",
            pricingStarterFeature4: "საბაზისო საძიებო სისტემების ოპტიმიზაცია (SEO)",

paymentPlansTitle: "განვადება",
plan5050Title: "50/50",
plan3moTitle: "3-თვიანი",
plan6moTitle: "6-თვიანი",
plan5050Period: "50% წინასწარ /\n50% გაშვებისას",
plan3moPeriod: "3 ყოველთვიური გადახდა\n(+15% საკომისიო)",
plan6moPeriod: "6 ყოველთვიური გადახდა\n(+25% საკომისიო)",

pricingStarterPrice5050: "600₾", pricingStarterPrice3mo: "460", pricingStarterPrice6mo: "250₾",
pricingProPrice5050: "1250", pricingProPrice3mo: "955", pricingProPrice6mo: "520",
pricingPremiumPrice5050: "2600", pricingPremiumPrice3mo: "1990", pricingPremiumPrice6mo: "630",




            pricingProTitle: "პრო", pricingProPrice: "2,500₾", 
            pricingProFeature1: "მაქსიმუმ 5 მორგებული, მაღალკონვერტირებადი გვერდი",
            pricingProFeature2: "გაფართოებული ადმინისტრირებისა და ანალიტიკის დაფა",
            pricingProFeature3: "დინამიური CMS ინტეგრაცია (Supabase / Headless)",
            pricingProFeature4: "დახვეწილი, თანამედროვე მიკრო-ანიმაციები და ინტერაქციები",

            pricingPremiumTitle: "პრემიუმი", pricingPremiumPrice: "5,200₾", 
            pricingPremiumFeature1: "მაქსიმუმ 10 გვერდი და საწარმოო დონის მორგებული არქიტექტურა",
            pricingPremiumFeature2: "გაფართოებული ელ-კომერციის ან მორგებული ჯავშნების სისტემა",
            pricingPremiumFeature3: "ტექნიკური და გვერდზე SEO-ს სრულყოფილი აუდიტი",
            pricingPremiumFeature4: "პრიორიტეტული 24/7 პირდაპირი ხაზი და 3 თვიანი გაშვების შემდგომი მხარდაჭერა",

            pricingMostPopular: "პოპულარული", pricingGetStarted: "დაწყება", pricingBookACall: "ზარის დაჯავშნა",
            whatsappMessage: "გამარჯობა, მსურს ზარის დაჯავშნა თქვენს ვებ-გვერდის სერვისებზე სასაუბროდ.",

            seeAllReviews: "ყველა შეფასების ნახვა", allReviewsTitle: "რას ამბობენ კლიენტები", backToHome: "← უკან", noMoreReviews: "მეტი შეფასება არ არის",
            checkedTitle: "✓ შემოწმებული", webInfoTitle: "<span class=\"case-tag-prefix\">eCommerce · Stripe Checkout · </span>გამოშვების თარიღი: მაისი 2025", salesTitle: "+30% გაყიდვები", sourceTitle: "წყარო: GA4 • 60 დღე",
        },
        ru: {
            proPackageLabel: "Пакет Pro", starterPackageLabel: "Пакет Стартовый",
            badgeEyebrow: "✦ СЕЙЧАС ПРИНИМАЕМ ✦", badgeHeadline: "Только&nbsp;2&nbsp;премиум<br>проекта", badgeSub: "На июль 2026",

            individualPayment: "Индив.", individualTitle: "Индивидуальный проект", individualPrice: "Индивидуальная цена", individualDesc: "Расскажите нам о проекте",
            individualFeature1: "Многостраничные (10+) сайты", individualFeature2: "E-commerce и системы бронирования", individualFeature3: "Сложные API-интеграции",
            individualCardPrie: "Цена определяется сложностью проекта.",

     

            salesTitle2: "+22% продажи", sourceTitle2: "источник: Admin / GA4 • 45 день", webInfoTitle2: "<span class=\"case-tag-prefix\">Интернет-магазин · Производительность · </span>Запуск: апр 2025", viewPRTitle: "просмотреть проект",

            pageDescription: "OSG Digital Agency создаёт эксклюзивные, высокоэффективные веб-сайты для бизнеса, который не терпит посредственности.",
            pageTitle: "OSG Digital Agency - Бутик-студия веб-разработки премиум-класса",

            navServices: "Услуги", navPortfolio: "Портфолио", navTestimonials: "Отзывы", navPricing: "Цены", navContact: "Контакты",
            heroTitle: "Свой бизнес,<br><span class='gradient-text'>в цифре.</span>", heroSubtitle: "Сайты, которые работают на вас", heroButton: "Начать проект <i class=\"fas fa-chevron-right\" aria-hidden=\"true\"></i>", heroButtonSecondary: "Изучить услуги",

            servicesTitle: "Наша цель – ваш успех",
            service1Title: "Дизайн", service1Desc: "Технически совершенного сайта недостаточно — визуальное впечатление решает, останется ли пользователь. Дизайн должен быть современным, понятным и адаптированным под бренд.",
            service2Title: "Безопасность", service2Desc: "Доверие пользователей начинается с безопасности сайта. Современные механизмы защиты обеспечивают отражение хакерских атак, утечек данных и других угроз.",
            service3Title: "Простое управление", service3Desc: "Интуитивно понятная система позволяет легко изменять тексты, добавлять изображения и настраивать сайт под свои нужды — без знаний кодирования.",

            portfolioTitle: "Избранные работы",
            flagship1Title: "'Jagi Building' - Сайт строительной компании", flagship2Title: "'Laptop Georgia' - Сайт по ремонту техники", flagship3Title: "'Stilis Sivrce' - Сайт магазина одежды", flagship4Title: "'Terra 24' - Сайт ритуального бюро",
            flagship5Title: "'Prime Grind' - Сайт строительной компании", flagship6Title: "'Skhila Diesel Motors' - Сайт автосервиса", flagship7Title: "'La Arté' - Сайт ювелирного бренда", flagship8Title: "'EVAKUATORIGZAZE' - Сайт эвакуатора",
            portfolio1Title: "'Золотая Вилка' - Сайт ресторана", portfolio2Title: "'Дом Стрижки' - Брендинг барбершопа", portfolio3Title: "'Олио и Сале' - Онлайн-сайт кафе",
            portfolio4Title: "'полезный салат' - Сайт ресторана", portfolio5Title: "'Naxus AI' — Корпоративный технологический веб-сайт",

            testimonialsTitle: "Отзывы и рекомендации", contactTitle: "Свяжитесь с нами", contactInfoTitle: "Контактная информация",
            contactInfoDesc: "Есть проект или вопрос? Напишите нам, позвоните или заполните форму.",
            reviewPromptText: "Работали с нами? Мы будем рады вашему отзыву.", contactInfoLocation: "Тбилиси, Грузия",

            formNamePlaceholder: "Ваше имя", formEmailPlaceholder: "Ваш email", formMessagePlaceholder: "Ваше сообщение", formSendButton: "Отправить",
            formFullNamePlaceholder: "полное имя", formCompanyPlaceholder: "Название компании", formWebsitePlaceholder: "Ссылка на сайт",
            reviewFormMessagePlaceholder: "Оставьте свой отзыв здесь...", reviewFormRatingLabel: "Ваша оценка", formLogoPlaceholder: "Логотип компании (по жел.)", formInterestMessage: "Здравствуйте, я заинтересован в пакете {planName}.",

            footerAbout: "Бутик-студия премиум-класса, создающая цифровое присутствие для брендов, которым нужно совершенство.",
            footerContactTitle: "Свяжитесь с нами", footerSocialTitle: "Подпишитесь на нас", footerCopyright: "© 2026 OSG Digital Agency. Все права защищены.", footerTerms: "Условия использования",

            reviewPageTitle: "Оставить отзыв", reviewPageSubtitle: "Ваш отзыв помогает нам стать еще лучше.", reviewFormSubmitButton: "Отправить отзыв",
            reviewSuccessTitle: "Спасибо!", reviewPendingMessage: "Ваш отзыв будет опубликован после подтверждения вашего проекта.",

            pricingTitle: "Простые, прозрачные цены", oneTimePayment: "Разовый платеж", oneTimePaymentTitle: "Разовый",

            groupInfrastructure: "Цифровая инфраструктура", groupPerformanceSeo: "Производительность и SEO",
            groupAutomation: "Автоматизация и впечатления", groupEnterpriseSupport: "Корпоративная поддержка",
            pricingProInclLabel: "Включает все возможности пакета Starter +", pricingPremiumInclLabel: "Включает все возможности пакета Pro +",

            pricingStarterTitle: "Стартовый", pricingStarterPrice: "1 200₾", 
            pricingStarterFeature1: "Индивидуальная многосекционная цифровая инфраструктура (до 3 страниц высокого качества)",
            pricingStarterFeature2: "Продуманный пользовательский опыт (UX) и люксовая визуальная архитектура",
            pricingStarterFeature3: "Максимально быстрая оптимизация производительности (95+ баллов Google PageSpeed)",
            pricingStarterFeature4: "Базовая поисковая оптимизация (SEO)",


paymentPlansTitle: "Планы оплаты",
plan5050Title: "50/50",
plan3moTitle: "На 3 месяца",
plan6moTitle: "На 6 месяцев",
plan5050Period: "50% предоплата /\n50% при запуске",
plan3moPeriod: "3 ежемесячных платежа\n(+15% комиссия)",
plan6moPeriod: "6 ежемесячных платежей\n(+25% комиссия)",

pricingStarterPrice5050: "600₾", pricingStarterPrice3mo: "460", pricingStarterPrice6mo: "250₾",
pricingProPrice5050: "1250", pricingProPrice3mo: "955", pricingProPrice6mo: "520",
pricingPremiumPrice5050: "2600", pricingPremiumPrice3mo: "1990", pricingPremiumPrice6mo: "630",


            pricingProTitle: "Про", pricingProPrice: "2 500₾", 
            pricingProFeature1: "До 5 индивидуальных страниц с высокой конверсией",
            pricingProFeature2: "Расширенная панель администрирования и аналитики",
            pricingProFeature3: "Динамическая интеграция CMS (Supabase / Headless)",
            pricingProFeature4: "Плавные современные микро-анимации и интерактивные эффекты",

            pricingPremiumTitle: "Премиум", pricingPremiumPrice: "5 200₾", 
            pricingPremiumFeature1: "До 10 страниц и корпоративная индивидуальная архитектура",
            pricingPremiumFeature2: "Продвинутая система электронной коммерции или бронирования",
            pricingPremiumFeature3: "Полный технический и SEO-аудит страниц",
            pricingPremiumFeature4: "Приоритетная круглосуточная линия связи и 3 месяца поддержки после запуска",

            pricingMostPopular: "популярный", pricingGetStarted: "Начать", pricingBookACall: "Заказать звонок",
            whatsappMessage: "Здравствуйте, я хотел бы заказать звонок, чтобы обсудить ваши услуги по веб-разработке.",

            seeAllReviews: "Посмотреть все отзывы", allReviewsTitle: "Что говорят наши клиенты", backToHome: "← Назад", noMoreReviews: "Больше отзывов нет",
            checkedTitle: "✓ Проверено", webInfoTitle: "<span class=\"case-tag-prefix\">eCommerce · Stripe Checkout · </span>Дата выхода: май 2025 г.", salesTitle: "+30% Продажи", sourceTitle: "источник: GA4 • 60 день",
        }
    };

    let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ka') ? 'ge' : (navigator.language.startsWith('ru') ? 'ru' : 'en'));
    let currentBillingPeriod = 'onetime';

    let currentPlanType = '5050';

function getPlanSuffix() {
    if (currentBillingPeriod !== 'plans') return '';
    return currentPlanType;
}
function getPeriodKey() {
    if (currentBillingPeriod === 'plans') {
        return currentPlanType === '5050' ? 'plan5050Period'
             : currentPlanType === '3mo' ? 'plan3moPeriod'
             : 'plan6moPeriod';
    }
    return 'oneTimePayment';
}


    const applyTranslations = (lang) => {
        document.body.setAttribute('data-lang', lang);

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

const priceKey = `pricing${planId}Price${getPlanSuffix()}`;
const periodKey = getPeriodKey();

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
            requestAnimationFrame(syncToggleIndicator);
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
            requestAnimationFrame(syncToggleIndicator);
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
                case 'Individual': planTitleKey = 'individualTitle'; break;
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
    // PRICING TOGGLE LOGIC + SLIDING INDICATOR
    // ===================================
    const billingToggleButtons = document.querySelectorAll('.toggle-btn');

    function syncToggleIndicator() {
        const toggle = document.querySelector('.billing-cycle-toggle');
        const indicator = document.querySelector('.toggle-indicator');
        const activeBtn = toggle?.querySelector('.toggle-btn.active');
        if (!toggle || !indicator || !activeBtn) return;

        const toggleRect = toggle.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        indicator.style.width = `${btnRect.width}px`;
        indicator.style.transform = `translateX(${btnRect.left - toggleRect.left}px)`;
    }

    const handleBillingToggle = (e) => {
        const selectedPeriod = e.currentTarget.getAttribute('data-period');
        if (selectedPeriod === currentBillingPeriod) return;

        currentBillingPeriod = selectedPeriod;

        const pricingGrid = document.querySelector('.pricing-cards-grid');
        const standardCards = document.querySelectorAll('.pricing-card:not(.individual-plan)');
        const individualCard = document.querySelector('.pricing-card.individual-plan');

        billingToggleButtons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        e.currentTarget.setAttribute('aria-checked', 'true');
        billingToggleButtons.forEach(btn => { if (btn !== e.currentTarget) btn.setAttribute('aria-checked', 'false'); });
        const billingToggleEl = document.querySelector('.billing-cycle-toggle');
billingToggleEl?.classList.toggle('is-individual', currentBillingPeriod === 'individual');
billingToggleEl?.classList.toggle('is-plans', currentBillingPeriod === 'plans');

const planSubtoggle = document.getElementById('plan-subtoggle');
if (planSubtoggle) planSubtoggle.hidden = currentBillingPeriod !== 'plans';
        syncToggleIndicator();

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

const priceKey = `pricing${planId}Price${getPlanSuffix()}`;
const periodKey = getPeriodKey();

                priceEl.textContent = translations[currentLang][priceKey];
                periodEl.textContent = translations[currentLang][periodKey];
            });
        }
    };

    billingToggleButtons.forEach(button => {
        button.addEventListener('click', handleBillingToggle);
    });

    // === NEW SUB-TOGGLE LISTENER ===
    document.querySelectorAll('.subtoggle-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const selectedPlan = e.currentTarget.getAttribute('data-plan');
            if (selectedPlan === currentPlanType) return;
            
            currentPlanType = selectedPlan;

            // 1. Update visual 'active' state on sub-buttons
            document.querySelectorAll('.subtoggle-btn').forEach(btn => {
                btn.classList.toggle('active', btn === e.currentTarget);
                btn.setAttribute('aria-checked', btn === e.currentTarget ? 'true' : 'false');
            });

            // 2. Refresh the prices on the cards instantly
            document.querySelectorAll('.pricing-card:not(.individual-plan)').forEach(card => {
                const planId = card.getAttribute('data-plan-id');
                const priceEl = card.querySelector('[data-price-point]');
                const periodEl = card.querySelector('[data-billing-period]');
                
                if (priceEl && periodEl) {
                    const priceKey = `pricing${planId}Price${getPlanSuffix()}`;
                    const periodKey = getPeriodKey();
                    
                    priceEl.textContent = translations[currentLang][priceKey];
                    periodEl.textContent = translations[currentLang][periodKey];
                }
            });
        });
    });

    requestAnimationFrame(syncToggleIndicator);
    window.addEventListener('resize', () => requestAnimationFrame(syncToggleIndicator));


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

        // --- Build dots: ONE real dot per project, inside a track that's
        // wider than its viewport. `.carousel-dots` is the viewport
        // (`overflow: hidden`, ~5 dots wide); `.carousel-dots-track` is
        // the full-width strip of `total` dots that physically slides
        // via `transform`, so extra dots visibly scroll past behind the
        // centered active one instead of just relabeling 5 static dots. ---
        const dotsTrack = document.createElement('div');
        dotsTrack.className = 'carousel-dots-track';
        dotsContainer.appendChild(dotsTrack);

        const dots = [];
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Go to project ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsTrack.appendChild(dot);
            dots.push(dot);
        }

        // Size the viewport by measuring REAL rendered geometry directly
        // (not a hand-rolled width formula), with the CENTER slot marked
        // active — the exact "2 resting + 1 active pill + 2 resting"
        // configuration the steady-state slide shows — then add a small
        // rounding buffer. This is what guarantees all 5 dots actually
        // fit with zero clipping, regardless of gap units or subpixel
        // rounding quirks.
        const VISIBLE_SLOTS = Math.min(5, total);
        const centerSlot = Math.min(Math.floor(VISIBLE_SLOTS / 2), total - 1);
        const restingDotWidth = dots[0].offsetWidth;
        const dotGap = parseFloat(getComputedStyle(dotsTrack).gap) || 0;
        const dotPitch = restingDotWidth + dotGap;

        // Suspend the transition while measuring: toggling `.is-active`
        // and reading `offsetWidth`/`offsetLeft` in the same synchronous
        // tick can otherwise catch the width mid-transition (or before
        // it's committed at all), silently under-measuring the pill and
        // making the viewport a few px too narrow to fit the 5th dot.
        // `transition: none` forces the new width to apply instantly.
        dots[centerSlot].style.transition = 'none';
        dots[centerSlot].classList.add('is-active');
        void dots[centerSlot].offsetWidth; // force the style flush above to take effect

        const firstVisibleDot = dots[0];
        const lastVisibleDot = dots[VISIBLE_SLOTS - 1];
        const measuredSpan =
            (lastVisibleDot.offsetLeft + lastVisibleDot.offsetWidth) - firstVisibleDot.offsetLeft;

        dots[centerSlot].classList.remove('is-active');
        void dots[centerSlot].offsetWidth; // flush the removal too, before restoring the transition
        dots[centerSlot].style.transition = '';

        const TRAILING_BUFFER = 23;
        dotsContainer.style.width = `${Math.ceil(measuredSpan) + TRAILING_BUFFER}px`;

        const syncDots = () => {
            if (!dots.length) return;
            dots.forEach((dot, i) => dot.classList.toggle('is-active', i === currentIndex));

            // Fixed-step slide, not continuous centering:
            //   item 0, 1        -> 0 steps (start of track)
            //   item 2 .. N-3    -> (currentIndex - 2) steps — the active
            //                       dot always lands in the 3rd (center)
            //                       visible slot while the track itself
            //                       keeps sliding by exactly 1 step
            //   item N-2, N-1    -> locked at (N - 5) steps (end of track)
            let steps = 0;
            if (total > VISIBLE_SLOTS) {
                if (currentIndex <= 1) steps = 0;
                else if (currentIndex >= total - 2) steps = total - VISIBLE_SLOTS;
                else steps = currentIndex - 2;
            }

            dotsTrack.style.transform = `translateX(${-(steps * dotPitch)}px)`;
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

            syncDots();

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


    // ================================
    // GSAP SCROLL REVEAL — PORTFOLIO
    // Staggered, hardware-accelerated entrance for every carousel card
    // as the section scrolls into view. `clearProps` hands control back
    // to the CSS is-active/hover rules the instant the tween settles, so
    // it never fights the carousel's own opacity/scale logic afterward.
    // ================================
    const initPortfolioScrollReveal = () => {
        const items = document.querySelectorAll('.carousel-item');
        if (!items.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        gsap.from(items, {
            opacity: 0,
            y: 40,
            scale: 0.94,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.1,
            clearProps: 'opacity,transform',
            scrollTrigger: {
                trigger: '#portfolio',
                start: 'top 80%',
                once: true
            }
        });
    };

    initPortfolioScrollReveal();


    // ================================
    // "PRO MAX" MICRO-INTERACTIONS
    // Magnetic buttons + cursor-spotlight cards.
    // Skipped on touch devices and when the user prefers reduced motion.
    // ================================
    const prefersFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersFinePointer && !prefersReducedMotion) {
        initMagneticButtons();
        initSpotlightCards();
    }

    function initMagneticButtons() {
        const MAGNET_STRENGTH = 0.28;
        const MAX_OFFSET = 10;

        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            let pendingEvent = null;

            btn.addEventListener('mousemove', (e) => {
                const isFirstPending = pendingEvent === null;
                pendingEvent = e;
                if (!isFirstPending) return;

                requestAnimationFrame(() => {
                    const rect = btn.getBoundingClientRect();
                    const relX = pendingEvent.clientX - (rect.left + rect.width / 2);
                    const relY = pendingEvent.clientY - (rect.top + rect.height / 2);
                    const offsetX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * MAGNET_STRENGTH));
                    const offsetY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * MAGNET_STRENGTH));
                    btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                    pendingEvent = null;
                });
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    function initSpotlightCards() {
        document.querySelectorAll('.card, .pricing-card').forEach(card => {
            let pendingEvent = null;

            card.addEventListener('mousemove', (e) => {
                const isFirstPending = pendingEvent === null;
                pendingEvent = e;
                if (!isFirstPending) return;

                requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    card.style.setProperty('--spot-x', `${pendingEvent.clientX - rect.left}px`);
                    card.style.setProperty('--spot-y', `${pendingEvent.clientY - rect.top}px`);
                    pendingEvent = null;
                });
            });
        });
    }


    // ================================
    // CINEMATIC BACKGROUND — scroll-driven pan & zoom
    // The fixed `.site-bg-image` texture layer pans from a zoomed-in
    // top-left frame (hero) to the right, then down, as the user
    // scrolls — a "camera move" instead of a static backdrop. Pure
    // transform (translate + scale) updated via rAF, so it's
    // compositor-only. Skipped for prefers-reduced-motion (the CSS
    // fallback frame in style.css stays put in that case).
    // ================================
    (function initCinematicBackground() {
        const bgImage = document.getElementById('site-bg-image');
        if (!bgImage || prefersReducedMotion) return;

        const OVERSCAN = 1.2; // must match `inset: -15%` on .site-bg-image (130% box per axis)

        // Camera path: p = scroll progress (0 → 1).
        // fracX/fracY = fraction of the max safe pan at that stop's scale
        // (+X/+Y = show the image's top-left; pans toward -X/-Y = right & down).
        // Scale stays barely above 1:1 throughout — a wide, zoomed-out field
        // of view so the texture's detail and grain stay clearly visible
        // everywhere, while still tracing the same top-left → right →
        // bottom-center path.
        const STOPS = [
            { p: 0.00, fracX:  0.55, fracY:  0.60, scale: 1.015 },
            { p: 0.32, fracX: -0.50, fracY:  0.25, scale: 1.010 },
            { p: 0.66, fracX: -0.55, fracY: -0.50, scale: 1.006 },
            { p: 1.00, fracX: -0.25, fracY: -0.70, scale: 1.002 },
        ];

        function interpolate(p) {
            if (p <= STOPS[0].p) return STOPS[0];
            for (let i = 1; i < STOPS.length; i++) {
                if (p <= STOPS[i].p) {
                    const a = STOPS[i - 1], b = STOPS[i];
                    const t = (p - a.p) / (b.p - a.p || 1);
                    return {
                        fracX: a.fracX + (b.fracX - a.fracX) * t,
                        fracY: a.fracY + (b.fracY - a.fracY) * t,
                        scale: a.scale + (b.scale - a.scale) * t,
                    };
                }
            }
            return STOPS[STOPS.length - 1];
        }

        // Max px a (translate-then-scale) layer can shift on one axis
        // before its edge clears the viewport on that side.
        function maxPan(scale, viewportSize) {
            return Math.max(0, (viewportSize * (OVERSCAN * scale - 1)) / 2);
        }

        let currentX = 0, currentY = 0, currentScale = STOPS[0].scale;
        let targetX = 0, targetY = 0, targetScale = STOPS[0].scale;
        let rafId;

        function computeTarget() {
            const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
            const mobileDamp = window.innerWidth < 768 ? 0.6 : 1;

            const frame = interpolate(progress);
            targetScale = frame.scale;
            targetX = frame.fracX * mobileDamp * maxPan(frame.scale, window.innerWidth);
            targetY = frame.fracY * mobileDamp * maxPan(frame.scale, window.innerHeight);
        }

        function tick() {
            currentX += (targetX - currentX) * 0.07;
            currentY += (targetY - currentY) * 0.07;
            currentScale += (targetScale - currentScale) * 0.07;
            bgImage.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;
            rafId = requestAnimationFrame(tick);
        }

        computeTarget();
        rafId = requestAnimationFrame(tick);

        window.addEventListener('scroll', computeTarget, { passive: true });
        window.addEventListener('resize', computeTarget);
        window.addEventListener('pagehide', function () {
            cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', computeTarget);
            window.removeEventListener('resize', computeTarget);
        });
    })();
});
