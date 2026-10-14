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
                if (targetView) {
                    targetView.classList.add('active');
                    // lets a page load what it needs only once it's opened
                    targetView.dispatchEvent(new CustomEvent('view:shown'));
                }
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
            // Landing on the hero: the main view is already visible (it's
            // `.active` in the HTML) and the page opens at the top, so skip the
            // 0.5s scroll tween that forced a full layout during page load.
            // (Don't read window.scrollY here — that alone forces a layout.)
            if (initialHash === '#hero') {
                document.querySelectorAll('.nav-link[href="#hero"]').forEach(link => link.classList.add('active-link'));
                return;
            }
            this.switchView(initialHash, true);
        }
    };

    SpaNavigator.init();

    // For below-the-fold setup that measures the page (AOS, the portfolio
    // carousel): run it right after the first frame has rendered, when the
    // layout is already computed, instead of forcing an extra synchronous
    // layout in the middle of page load.
    const afterFirstFrame = (fn) => requestAnimationFrame(() => setTimeout(fn, 0));


    // ================================
    // AOS INIT
    // ================================
    afterFirstFrame(() => AOS.init({ duration: 800, once: true, offset: 50 }));

    // AOS works out each element's trigger point once, from the page layout
    // at that moment. When the layout changes afterwards (switching to the
    // contact/reviews page, showing the Individual card, the payment-plan
    // row opening) those points go stale and an element — most visibly the
    // footer — can stay invisible. This observer reveals any [data-aos]
    // element as soon as it's actually on screen, whatever AOS thinks.
    if ('IntersectionObserver' in window) {
        const aosObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('aos-animate');
                aosObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -40px 0px' });
        afterFirstFrame(() => document.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el)));
    }

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
            badgeEyebrow: "Now accepting", badgeHeadline: "Only&nbsp;<span class='sign-num'>3</span>&nbsp;Premium<br>Projects", badgeSub: "For October 2026",

            individualPayment: "Individual", individualTitle: "Custom Solution", individualPrice: "Custom Quote", individualDesc: "Tell us about your project",
            individualFeature1: "Multi-page (10+) websites", individualFeature2: "E-commerce & Booking Systems", individualFeature3: "Advanced API Integrations",
            individualCardPrie: "The price is determined by the project complexity.",

            salesTitle2: "+22% sales", sourceTitle2: "Source: Admin / GA4 • 45 day", webInfoTitle2: "<span class=\"case-tag-prefix\">Online Store · Performance · </span>Launched: Apr 2025", viewPRTitle: "View Live Project",

            pageDescription: "Website development in Tbilisi from 600 GEL: fast, SEO-ready websites, online stores and admin panels. Pay in full, 50/50 or over 3 months.",
            pageTitle: "Website Development in Tbilisi from 600 GEL | OSGWeb.ge",

            navServices: "Services", navPortfolio: "Portfolio", navTestimonials: "Testimonials", navPricing: "Pricing", navContact: "Contact",
            heroTitle: "Web Agency<br><span class='gradient-text'>in Tbilisi</span>", heroSubtitle: "We build websites that sell.", heroSubtext: "<span>Website development</span> · <span>Online stores</span> · <span>Web apps</span>", heroButton: "Start a Project <i class=\"fas fa-chevron-right\" aria-hidden=\"true\"></i>", heroButtonSecondary: "Explore Services",

            servicesTitle: "Not just a beautiful website. A sales system.",
            service1Title: "Design", service1Desc: "A technically sound website is not enough , the visual impression decides whether the user stays. The design should be modern, easy to understand, and tailored to the brand.",
            service2Title: "Security", service2Desc: "User trust begins with website security. Modern protection mechanisms ensure defense against hacking attacks, data leaks, and other threats.",
            service3Title: "Easy Management", service3Desc: "An intuitive system lets you easily change texts, add images, and customize the site to your needs , without coding knowledge.",

            portfolioTitle: "Projects &amp; Case Studies",
            filterClientLabel: "Client Sites", filterTemplateLabel: "Template Builds", viewDemoTitle: "View Demo",
            flagship09Title:"'Sufta Sivrce' - Hotel laundry website" ,flagship1Title: "'Jagi Building' - Construction Website", flagship2Title: "'Laptop Georgia' - Tech Repair Website", flagship3Title: "'Stilis Sivrce' - Clothing Store Website", flagship4Title: "'Terra 24' - Funeral Bureau Website",
            flagship5Title: "'Prime Grind' - Construction Website", flagship6Title: "'Skhila Diesel Motors' - Car Care Website", flagship7Title: "'La Arté' - Jewellery Website", flagship8Title: "'EVAKUATORIGZAZE' - Tow Truck Website",
            portfolio1Title: "'The Golden Fork' - Restaurant Website", portfolio2Title: "'The Trim House' - Barbershop Branding", portfolio3Title: "'Olio & Sale' - Cafe Online Website",
            portfolio4Title: "'Healthy Salad' - Restaurant Website", portfolio5Title: "'Naxus AI' - Corporate Tech Website",
            portfolio6Title: "'Ioseb Tsikaridze Studio' - Photography Studio Website", portfolio7Title: "'zoobum' - Pet Shop Website",
            portfolio8Title: "'Hellshop' - Perfume Store Website", portfolio9Title: "'Everluxe' - Watch Brand Website",

            testimonialsTitle: "Reviews and Testimonials", contactTitle: "Contact Us", contactInfoTitle: "Contact Information",
            contactInfoDesc: "Have a project or question? Write to us, call us, or fill out the form.",
            reviewPromptText: "Have you worked with us? We’d love to hear your feedback.", contactInfoLocation: "Tbilisi, Georgia",
            emailSalesLabel: "New projects", emailSupportLabel: "Support",

            formNamePlaceholder: "Your Name", formFullNamePlaceholder: "Full Name", formEmailPlaceholder: "Your Email", formCompanyPlaceholder: "Company Name",
            formMessagePlaceholder: "Your Message", formWebsitePlaceholder: "Link of website", reviewFormMessagePlaceholder: "Write your review here...", reviewFormRatingLabel: "Rating",
            formLogoPlaceholder: "Add company logo", formSendButton: "Send", formInterestMessage: "Hello, I am interested in the {planName} package.",

            footerAbout: "A top 1% boutique studio engineering digital presence for brands that demand excellence.",
            footerContactTitle: "Contact Us", footerSocialTitle: "Follow Us", footerCopyright: "© 2026 OSG Digital Agency. All Rights Reserved.", footerTerms: "Terms of Service",

            reviewPageTitle: "Leave a Review", reviewPageSubtitle: "Your feedback helps us become even better.", reviewFormSubmitButton: "Submit Review",
            reviewSuccessTitle: "Thank You!", reviewPendingMessage: "Your review will be published after we confirm your project.",

            pricingTitle: "An Investment in Your Digital Growth", pricingSubtitle: "Choose the format that fits your goals, or contact us for a one-on-one consultation.",

            oneTimePaymentTitle: "One-time", oneTimePayment: "One-time payment",

            groupInfrastructure: "Digital Infrastructure", groupPerformanceSeo: "Performance & SEO",
            groupAutomation: "Automation & Experience", groupEnterpriseSupport: "Enterprise Support",
            pricingProInclLabel: "Includes All Starter Tier Capabilities +", pricingPremiumInclLabel: "Includes All Pro Tier Capabilities +",

            pricingStarterTitle: "Starter",
            pricingStarterFeature1: "Custom Multi-Section Digital Infrastructure (Up to 3 high-fidelity pages)",
            pricingStarterFeature2: "Bespoke User Experience (UX) & Luxury Visual Architecture",
            pricingStarterFeature3: "Blazing-Fast Performance Optimization (95+ Google PageSpeed Score)",
            pricingStarterFeature4: "Core Search Engine Optimization (SEO)",

            paymentPlansTitle: "Payment Plans", plan5050Title: "50/50", plan3moTitle: "3-Month",
            plan5050Period: "50% Upfront / 50% at Launch",
            // {rate} = the 3-month fee in %, from PRICING
            plan3moPeriod: "{rate}% fee",

            pricingMiniTitle: "Mini", pricingMiniInclLabel: "What's Included",
            pricingMiniFeature1: "One-page website, e.g. a landing page or a menu",
            pricingMiniFeature2: "Mobile-friendly, fast-loading design",
            pricingMiniFeature3: "Basic search engine optimization (SEO)",
            miniPromoUntil: "Act fast! Offer ends {date}",
            miniPromoLeftDays: "Ends in {d}d {h}h", miniPromoLeftHours: "Ends in {h}h {m}m",
            miniPromoLock: "Make your first payment today!",

            pricingProTitle: "Pro",
            pricingProFeature1: "Up to 5 Custom High-Conversion Pages",
            pricingProFeature2: "Advanced Admin & Analytics Dashboard",
            pricingProFeature3: "Dynamic CMS Integration (Supabase / Headless)",
            pricingProFeature4: "Fluid Modern Micro-Animations & Interactions",

            pricingPremiumTitle: "Premium",
            pricingPremiumFeature1: "Up to 10 Pages & Enterprise Custom Architecture",
            pricingPremiumFeature2: "Advanced E-commerce / Custom Booking Engine",
            pricingPremiumFeature3: "Comprehensive Technical & On-Page SEO Audit",
            pricingPremiumFeature4: "Priority 24/7 Dedicated Line & 3 Months Post-Launch Maintenance",

            pricingMostPopular: "Most Popular", pricingGetStarted: "Get Started", seeWorksButton: "See Works", seeWorksSoon: "Premium works coming soon!", pricingBookACall: "Book a Call",
            worksPageTitle: "Our Work by Package", worksPageSubtitle: "Explore the templates, demos and client websites we’ve built, all in one place.",
            whatsappMessage: "Hello! I'd like to book a call to discuss your web services.",

            seeAllReviews: "See All Reviews", allReviewsTitle: "What Our Clients Say", backToHome: "← Back", noMoreReviews: "No more reviews",
            checkedTitle: "✓ Checked", webInfoTitle: "<span class=\"case-tag-prefix\">eCommerce · Stripe Checkout · </span>Launched: May 2025", salesTitle: "+30% Sales", sourceTitle: "Source: GA4 • 60 day",
        },
        ge: {
            proPackageLabel: "პრო პაკეტი", starterPackageLabel: "სტარტერ პაკეტი",
            badgeEyebrow: "ამჟამად ვიღებთ", badgeHeadline: "მხოლოდ&nbsp;<span class='sign-num'>3</span>&nbsp;პრემიუმ<br>პროექტს", badgeSub: "2026 წლის ოქტომბრისთვის",

            individualPayment: "ინდივ.", individualTitle: "სპეციალური შეკვეთა", individualPrice: "ინდივიდუალური შეთავაზება", individualDesc: "მოგვიყევით პროექტზე.",
            individualFeature1: "10+ გვერდიანი ვებსაიტი", individualFeature2: "ელ. კომერცია და ჯავშნები", individualFeature3: "API-ს რთული ინტეგრაციები",
            individualCardPrie: "ფასი განისაზღვრება პროექტის სირთულის მიხედვით.",

        

            salesTitle2: "+22% გაყიდვები", sourceTitle2: "წყარო: Admin / GA4 • 45 დღე", webInfoTitle2: "<span class=\"case-tag-prefix\">ონლაინ მაღაზია · შესრულება · </span>გამოშვების თარიღი: აპრ 2025", viewPRTitle: "პროექტის ნახვა",

            pageDescription: "ვებსაიტების დამზადება თბილისში 600 ლარიდან: სწრაფი, SEO-ზე მორგებული საიტები, ონლაინ მაღაზიები და ადმინ პანელი. გადახდა ერთიანად, 50/50 ან 3 თვეში.",
            pageTitle: "საიტის დამზადება თბილისში 600 ლარიდან | OSGWeb.ge",

            navServices: "სერვისები", navPortfolio: "პორტფოლიო", navTestimonials: "შეფასებები", navPricing: "ფასები", navContact: "კონტაქტი",
            heroTitle: "ვებ სააგენტო<br><span class='gradient-text'>თბილისში</span>", heroSubtitle: "ვქმნით საიტებს, რომლებიც ყიდის.", heroSubtext: "<span>საიტის დამზადება</span> · <span>ონლაინ მაღაზიები</span> · <span>ვებ აპლიკაციები</span>", heroButton: "პროექტის დაწყება <i class=\"fas fa-chevron-right\" aria-hidden=\"true\"></i>", heroButtonSecondary: "სერვისების ნახვა",

            servicesTitle: "არა უბრალოდ ლამაზი საიტი, არამედ გაყიდვების სისტემა.",
            service1Title: "დიზაინი", service1Desc: "ტექნიკურად გამართული საიტი საკმარისი არაა , ვიზუალური შთაბეჭდილება გადაწყვიტავს, დარჩება თუ არა მომხმარებელი. დიზაინი უნდა იყოს თანამედროვე, მარტივად აღსაქმელი და ბრენდზე მორგებული.",
            service2Title: "უსაფრთხოება", service2Desc: "მომხმარებლის ნდობა იწყება საიტის უსაფრთხოებით. თანამედროვე დაცვით მექანიზმებს უზრუნველყოფს ჰაკერული თავდასხმების, მონაცემთა გაჟონვის და სხვა საფრთხეებისგან დაცვას.",
            service3Title: "მარტივი მართვა", service3Desc: "ინტუიციური სისტემა საშუალებას გაძლევთ მარტივად შეცვალოთ ტექსტები, დაამატოთ სურათები და მოარგოთ საიტი თქვენს საჭიროებებს , კოდის ცოდნის გარეშე.",

            portfolioTitle: "განხორციელებული პროექტები &amp; ქეისები",
            filterClientLabel: "კლიენტის საიტები", filterTemplateLabel: "შაბლონები", viewDemoTitle: "დემოს ნახვა",
            flagship09Title:"'Sufta Sivrce' - სასტუმროს სამრეცხაო ვებსაიტი" ,flagship1Title: "'Jagi Building' - სამშენებლო კომპანიის ვებსაიტი", flagship2Title: "'Laptop Georgia' - ტექნიკის შეკეთების ვებსაიტი", flagship3Title: "'Stilis Sivrce' - ტანსაცმლის მაღაზიის ვებსაიტი", flagship4Title: "'Terra 24' - სარიტუალო ბიუროს ვებსაიტი",
            flagship5Title: "'Prime Grind' - სამშენებლო კომპანიის ვებსაიტი", flagship6Title: "'Skhila Diesel Motors' - ავტოსერვისის ვებსაიტი", flagship7Title: "'La Arté' - საიუველირო ვებსაიტი", flagship8Title: "'EVAKUATORIGZAZE' - ევაკუატორის სერვისის ვებსაიტი",
            portfolio1Title: "'The Golden Fork' - რესტორნის ვებსაიტი", portfolio4Title: "'Healthy Salad' - რესტორნის ვებსაიტი", portfolio5Title: "'Naxus AI' - კორპორატიული ტექნოლოგიური ვებსაიტი",
            portfolio2Title: "'The Trim House' - ბარბერშოპის ბრენდინგი", portfolio3Title: "'Olio & Sale' - კაფეს ონლაინ ვებსაიტი",
            portfolio6Title: "'Ioseb Tsikaridze Studio' - ფოტოსტუდიის ვებსაიტი", portfolio7Title: "'zoobum' - ზოომაღაზიის ვებსაიტი",
            portfolio8Title: "'Hellshop' - სუნამოების მაღაზიის ვებსაიტი", portfolio9Title: "'Everluxe' - საათების ბრენდის ვებსაიტი",

            testimonialsTitle: "მიმოხილვები და შეფასებები", reviewPromptText: "გვითანამშრომლია? სიამოვნებით მოვისმენთ თქვენს აზრს.",
            contactTitle: "დაგვიკავშირდით", contactInfoTitle: "საკონტაქტო ინფორმაცია", contactInfoDesc: "გაქვთ პროექტი ან შეკითხვა? მოგვწერეთ, დაგვირეკეთ, ან შეავსეთ ფორმა.",
            contactInfoLocation: "თბილისი, საქართველო",
            emailSalesLabel: "ახალი პროექტები", emailSupportLabel: "მხარდაჭერა",

            formFullNamePlaceholder: "სრული სახელი", formCompanyPlaceholder: "კომპანიის სახელი", formNamePlaceholder: "თქვენი სახელი", formWebsitePlaceholder: "ვებსაიტის ლინკი",
            reviewFormMessagePlaceholder: "დაწერეთ თქვენი შეფასება აქ...", reviewFormRatingLabel: "შეფასება", formLogoPlaceholder: "კომპანიის ლოგო (სურვ.)", formEmailPlaceholder: "თქვენი ელ.ფოსტა",
            formMessagePlaceholder: "თქვენი შეტყობინება", formSendButton: "გაგზავნა", formInterestMessage: "გამარჯობა, დაინტერესებული ვარ {planName} პაკეტით.",

            footerAbout: "ინოვაციური ციფრული გამოცდილება ბრენდის წარმატებისთვის.",
            footerContactTitle: "კონტაქტი", footerSocialTitle: "გამოგვყევით", footerCopyright: "© 2026 OSG Digital Agency. ყველა უფლება დაცულია.", footerTerms: "წესები და პირობები",

            reviewPageTitle: "შეფასების დატოვება", reviewPageSubtitle: "თქვენი გამოხმაურება გვეხმარება გავხდეთ უკეთესები.", reviewFormSubmitButton: "შეფასების გაგზავნა",
            reviewSuccessTitle: "გმადლობთ!", reviewPendingMessage: "თქვენი შეფასება გამოქვეყნდება პროექტის დადასტურების შემდეგ.",

            oneTimePaymentTitle: "ერთჯერადი", oneTimePayment: "ერთჯერადი გადახდა", pricingTitle: "ინვესტიცია თქვენს ციფრულ ზრდაში", pricingSubtitle: "აირჩიეთ თქვენს მიზნებზე მორგებული ფორმატი ან დაგვიკავშირდით ინდივიდუალური კონსულტაციისთვის.",

            groupInfrastructure: "ციფრული ინფრასტრუქტურა", groupPerformanceSeo: "წარმადობა და SEO",
            groupAutomation: "ავტომატიზაცია და გამოცდილება", groupEnterpriseSupport: "საწარმოო დონის მხარდაჭერა",
            pricingProInclLabel: "მოიცავს Starter პაკეტის ყველა შესაძლებლობას +", pricingPremiumInclLabel: "მოიცავს Pro პაკეტის ყველა შესაძლებლობას +",

            pricingStarterTitle: "სტარტერი",
            pricingStarterFeature1: "მორგებული მრავალსექციური ციფრული ინფრასტრუქტურა (მაქსიმუმ 3 მაღალი ხარისხის გვერდი)",
            pricingStarterFeature2: "ინდივიდუალური მომხმარებლის გამოცდილება (UX) და დახვეწილი ვიზუალური არქიტექტურა",
            pricingStarterFeature3: "მაქსიმალურად სწრაფი წარმადობის ოპტიმიზაცია (Google PageSpeed 95+ ქულა)",
            pricingStarterFeature4: "საბაზისო საძიებო სისტემების ოპტიმიზაცია (SEO)",

            paymentPlansTitle: "განვადება", plan5050Title: "50/50", plan3moTitle: "3-თვიანი",
            plan5050Period: "50% წინასწარ /\n50% გაშვებისას",
            plan3moPeriod: "{rate}% საკომისიო",

            pricingMiniTitle: "მინი", pricingMiniInclLabel: "რას მოიცავს",
            pricingMiniFeature1: "ერთგვერდიანი ვებსაიტი, მაგ. სავიზიტო გვერდი ან მენიუ",
            pricingMiniFeature2: "მობილურზე მორგებული, სწრაფი დიზაინი",
            pricingMiniFeature3: "საბაზისო საძიებო სისტემების ოპტიმიზაცია (SEO)",
            miniPromoUntil: "იჩქარეთ! აქცია მოქმედებს {date}-⁠მდე", // ⁠: no line break after the hyphen
            miniPromoLeftDays: "დასრულებამდე: {d} დღე {h} სთ", miniPromoLeftHours: "დასრულებამდე: {h} სთ {m} წთ",
            miniPromoLock: "გადაიხადეთ პირველი შენატანი დღესვე!",

            pricingProTitle: "პრო",
            pricingProFeature1: "მაქსიმუმ 5 მორგებული, მაღალკონვერტირებადი გვერდი",
            pricingProFeature2: "გაფართოებული ადმინისტრირებისა და ანალიტიკის დაფა",
            pricingProFeature3: "დინამიური CMS ინტეგრაცია (Supabase / Headless)",
            pricingProFeature4: "დახვეწილი, თანამედროვე მიკრო-ანიმაციები და ინტერაქციები",

            pricingPremiumTitle: "პრემიუმი",
            pricingPremiumFeature1: "მაქსიმუმ 10 გვერდი და საწარმოო დონის მორგებული არქიტექტურა",
            pricingPremiumFeature2: "გაფართოებული ელ-კომერციის ან მორგებული ჯავშნების სისტემა",
            pricingPremiumFeature3: "ტექნიკური და გვერდზე SEO-ს სრულყოფილი აუდიტი",
            pricingPremiumFeature4: "პრიორიტეტული 24/7 პირდაპირი ხაზი და 3 თვიანი გაშვების შემდგომი მხარდაჭერა",

            pricingMostPopular: "პოპულარული", pricingGetStarted: "დაწყება", seeWorksButton: "ნამუშევრების ნახვა", seeWorksSoon: "პრემიუმ ნამუშევრები მალე დაემატება!", pricingBookACall: "ზარის დაჯავშნა",
            worksPageTitle: "ნამუშევრები პაკეტების მიხედვით", worksPageSubtitle: "იხილეთ ჩვენს მიერ შექმნილი შაბლონები, დემოები და კლიენტების საიტები ერთ სივრცეში.",
            whatsappMessage: "გამარჯობა, მსურს ზარის დაჯავშნა თქვენს ვებ-გვერდის სერვისებზე სასაუბროდ.",

            seeAllReviews: "ყველა შეფასების ნახვა", allReviewsTitle: "რას ამბობენ კლიენტები", backToHome: "← უკან", noMoreReviews: "მეტი შეფასება არ არის",
            checkedTitle: "✓ შემოწმებული", webInfoTitle: "<span class=\"case-tag-prefix\">eCommerce · Stripe Checkout · </span>გამოშვების თარიღი: მაისი 2025", salesTitle: "+30% გაყიდვები", sourceTitle: "წყარო: GA4 • 60 დღე",
        },
        ru: {
            proPackageLabel: "Пакет Pro", starterPackageLabel: "Пакет Стартовый",
            badgeEyebrow: "Сейчас принимаем", badgeHeadline: "Только&nbsp;<span class='sign-num'>3</span>&nbsp;премиум<br>проекта", badgeSub: "На октябрь 2026",

            individualPayment: "Индив.", individualTitle: "Индивидуальный проект", individualPrice: "Индивидуальная цена", individualDesc: "Расскажите нам о проекте",
            individualFeature1: "Многостраничные (10+) сайты", individualFeature2: "E-commerce и системы бронирования", individualFeature3: "Сложные API-интеграции",
            individualCardPrie: "Цена определяется сложностью проекта.",

     

            salesTitle2: "+22% продажи", sourceTitle2: "источник: Admin / GA4 • 45 день", webInfoTitle2: "<span class=\"case-tag-prefix\">Интернет-магазин · Производительность · </span>Запуск: апр 2025", viewPRTitle: "просмотреть проект",

            pageDescription: "Создание сайтов в Тбилиси от 600 лари: быстрые сайты с SEO, интернет-магазины и админ-панели. Оплата сразу, 50/50 или за 3 месяца.",
            pageTitle: "Создание сайтов в Тбилиси от 600 лари | OSGWeb.ge",

            navServices: "Услуги", navPortfolio: "Портфолио", navTestimonials: "Отзывы", navPricing: "Цены", navContact: "Контакты",
            heroTitle: "Веб-агентство<br><span class='gradient-text'>в Тбилиси</span>", heroSubtitle: "Создаём сайты, которые продают.", heroSubtext: "<span>Создание сайтов</span> · <span>Интернет-магазины</span> · <span>Веб-приложения</span>", heroButton: "Начать проект <i class=\"fas fa-chevron-right\" aria-hidden=\"true\"></i>", heroButtonSecondary: "Изучить услуги",

            servicesTitle: "Не просто красивый сайт, а система продаж.",
            service1Title: "Дизайн", service1Desc: "Технически совершенного сайта недостаточно , визуальное впечатление решает, останется ли пользователь. Дизайн должен быть современным, понятным и адаптированным под бренд.",
            service2Title: "Безопасность", service2Desc: "Доверие пользователей начинается с безопасности сайта. Современные механизмы защиты обеспечивают отражение хакерских атак, утечек данных и других угроз.",
            service3Title: "Простое управление", service3Desc: "Интуитивно понятная система позволяет легко изменять тексты, добавлять изображения и настраивать сайт под свои нужды , без знаний кодирования.",

            portfolioTitle: "Реализованные проекты и кейсы",
            filterClientLabel: "Клиентские сайты", filterTemplateLabel: "На основе шаблонов", viewDemoTitle: "Смотреть демо",
            flagship09Title:"'Sufta Sivrce' - Веб-сайт прачечной при отеле" ,flagship1Title: "'Jagi Building' - Сайт строительной компании", flagship2Title: "'Laptop Georgia' - Сайт по ремонту техники", flagship3Title: "'Stilis Sivrce' - Сайт магазина одежды", flagship4Title: "'Terra 24' - Сайт ритуального бюро",
            flagship5Title: "'Prime Grind' - Сайт строительной компании", flagship6Title: "'Skhila Diesel Motors' - Сайт автосервиса", flagship7Title: "'La Arté' - Сайт ювелирного бренда", flagship8Title: "'EVAKUATORIGZAZE' - Сайт эвакуатора",
            portfolio1Title: "'Золотая Вилка' - Сайт ресторана", portfolio2Title: "'Дом Стрижки' - Брендинг барбершопа", portfolio3Title: "'Олио и Сале' - Онлайн-сайт кафе",
            portfolio4Title: "'полезный салат' - Сайт ресторана", portfolio5Title: "'Naxus AI' , Корпоративный технологический веб-сайт",
            portfolio6Title: "'Ioseb Tsikaridze Studio' - Сайт фотостудии", portfolio7Title: "'zoobum' - Сайт зоомагазина",
            portfolio8Title: "'Hellshop' - Сайт магазина парфюмерии", portfolio9Title: "'Everluxe' - Сайт часового бренда",

            testimonialsTitle: "Отзывы и рекомендации", contactTitle: "Свяжитесь с нами", contactInfoTitle: "Контактная информация",
            contactInfoDesc: "Есть проект или вопрос? Напишите нам, позвоните или заполните форму.",
            reviewPromptText: "Работали с нами? Мы будем рады вашему отзыву.", contactInfoLocation: "Тбилиси, Грузия",
            emailSalesLabel: "Новые проекты", emailSupportLabel: "Поддержка",

            formNamePlaceholder: "Ваше имя", formEmailPlaceholder: "Ваш email", formMessagePlaceholder: "Ваше сообщение", formSendButton: "Отправить",
            formFullNamePlaceholder: "полное имя", formCompanyPlaceholder: "Название компании", formWebsitePlaceholder: "Ссылка на сайт",
            reviewFormMessagePlaceholder: "Оставьте свой отзыв здесь...", reviewFormRatingLabel: "Оценка", formLogoPlaceholder: "Логотип компании (по жел.)", formInterestMessage: "Здравствуйте, я заинтересован в пакете {planName}.",

            footerAbout: "Бутик-студия премиум-класса, создающая цифровое присутствие для брендов, которым нужно совершенство.",
            footerContactTitle: "Свяжитесь с нами", footerSocialTitle: "Подпишитесь на нас", footerCopyright: "© 2026 OSG Digital Agency. Все права защищены.", footerTerms: "Условия использования",

            reviewPageTitle: "Оставить отзыв", reviewPageSubtitle: "Ваш отзыв помогает нам стать еще лучше.", reviewFormSubmitButton: "Отправить отзыв",
            reviewSuccessTitle: "Спасибо!", reviewPendingMessage: "Ваш отзыв будет опубликован после подтверждения вашего проекта.",

            pricingTitle: "Инвестиция в ваш цифровой рост", pricingSubtitle: "Выберите формат под ваши цели или свяжитесь с нами для индивидуальной консультации.", oneTimePayment: "Разовый платеж", oneTimePaymentTitle: "Разовый",

            groupInfrastructure: "Цифровая инфраструктура", groupPerformanceSeo: "Производительность и SEO",
            groupAutomation: "Автоматизация и впечатления", groupEnterpriseSupport: "Корпоративная поддержка",
            pricingProInclLabel: "Включает все возможности пакета Starter +", pricingPremiumInclLabel: "Включает все возможности пакета Pro +",

            pricingStarterTitle: "Стартовый",
            pricingStarterFeature1: "Индивидуальная многосекционная цифровая инфраструктура (до 3 страниц высокого качества)",
            pricingStarterFeature2: "Продуманный пользовательский опыт (UX) и люксовая визуальная архитектура",
            pricingStarterFeature3: "Максимально быстрая оптимизация производительности (95+ баллов Google PageSpeed)",
            pricingStarterFeature4: "Базовая поисковая оптимизация (SEO)",


            paymentPlansTitle: "Планы оплаты", plan5050Title: "50/50", plan3moTitle: "На 3 месяца",
            plan5050Period: "50% предоплата /\n50% при запуске",
            plan3moPeriod: "комиссия {rate}%",

            pricingMiniTitle: "Мини", pricingMiniInclLabel: "Что входит",
            pricingMiniFeature1: "Одностраничный сайт, например лендинг или меню",
            pricingMiniFeature2: "Адаптивный, быстрый дизайн для мобильных",
            pricingMiniFeature3: "Базовая поисковая оптимизация (SEO)",
            miniPromoUntil: "Спешите! Акция до {date}",
            miniPromoLeftDays: "До конца акции: {d} дн. {h} ч", miniPromoLeftHours: "До конца акции: {h} ч {m} мин",
            miniPromoLock: "Внесите первый платёж сегодня!",

            pricingProTitle: "Про",
            pricingProFeature1: "До 5 индивидуальных страниц с высокой конверсией",
            pricingProFeature2: "Расширенная панель администрирования и аналитики",
            pricingProFeature3: "Динамическая интеграция CMS (Supabase / Headless)",
            pricingProFeature4: "Плавные современные микро-анимации и интерактивные эффекты",

            pricingPremiumTitle: "Премиум",
            pricingPremiumFeature1: "До 10 страниц и корпоративная индивидуальная архитектура",
            pricingPremiumFeature2: "Продвинутая система электронной коммерции или бронирования",
            pricingPremiumFeature3: "Полный технический и SEO-аудит страниц",
            pricingPremiumFeature4: "Приоритетная круглосуточная линия связи и 3 месяца поддержки после запуска",

            pricingMostPopular: "популярный", pricingGetStarted: "Начать", seeWorksButton: "Смотреть работы", seeWorksSoon: "Премиум-работы скоро появятся!", pricingBookACall: "Заказать звонок",
            worksPageTitle: "Наши работы по пакетам", worksPageSubtitle: "Шаблоны, демо и сайты клиентов, созданные нами, в одном месте.",
            whatsappMessage: "Здравствуйте, я хотел бы заказать звонок, чтобы обсудить ваши услуги по веб-разработке.",

            seeAllReviews: "Посмотреть все отзывы", allReviewsTitle: "Что говорят наши клиенты", backToHome: "← Назад", noMoreReviews: "Больше отзывов нет",
            checkedTitle: "✓ Проверено", webInfoTitle: "<span class=\"case-tag-prefix\">eCommerce · Stripe Checkout · </span>Дата выхода: май 2025 г.", salesTitle: "+30% Продажи", sourceTitle: "источник: GA4 • 60 день",
        }
    };

    // Georgian is the default for everyone who hasn't picked a language.
    // Don't fall back to English for en-* browsers: Googlebot renders with
    // navigator.language "en-US", so that made Google index the English copy.
    let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ru') ? 'ru' : 'ge');
    let currentBillingPeriod = 'onetime';

    let currentPlanType = '5050';

    // ================================
    // PRICES — the one place to change a package price.
    // Every amount on the pricing cards is calculated from these numbers:
    //  · 50/50: two halves.
    //  · 3 months: price + fee (`threeMonthFeeRate`, rounded down to a
    //    multiple of 5₾), split into 3 payments rounded to 5₾ (the last one
    //    absorbs the rounding); the card shows the monthly payment.
    //  · Mini: `promoPrice` until `miniPromoEnds` (Tbilisi time, UTC+4), then
    //    `price` — the cards switch by themselves, no redeploy needed.
    //    `fixed`: the card shows its full price + "50% upfront / 50% at
    //    launch" on every tab (it doesn't follow the payment-plan toggle).
    // After editing, run `npm run prerender:ka` so index.html shows the same.
    // ================================
    // @pricing-start — tools/prerender-ka.js runs everything down to @pricing-end
    const PRICING = {
        miniPromoEnds: '2026-10-23T23:59:59+04:00',
        packages: {
            Mini:    { price: 600, promoPrice: 500, fixed: true },
            Starter: { price: 990 },
            Pro:     { price: 2190 },
            Premium: { price: 4490 },
        },
        threeMonthFeeRate: 0.10,
    };

    const isMiniPromoActive = () => Date.now() < Date.parse(PRICING.miniPromoEnds);

    // `total` split into `count` payments rounded to 5₾; the last one takes
    // the rounding difference, so the payments always add up to `total`.
    function splitPayments(total, count) {
        const each = Math.round(total / count / 5) * 5;
        return [...Array(count - 1).fill(each), total - each * (count - 1)];
    }

    // What a package costs under each payment option.
    function paymentOptions(price) {
        const fee = Math.floor(price * PRICING.threeMonthFeeRate / 5) * 5;
        return { onetime: [price], '5050': splitPayments(price, 2), '3mo': splitPayments(price + fee, 3) };
    }

    const formatNumber = (n, lang) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'ru' ? ' ' : ',');
    const formatGel = (n, lang) => `${formatNumber(n, lang)}₾`;

    const MONTHS = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        ge: ['იანვრის', 'თებერვლის', 'მარტის', 'აპრილის', 'მაისის', 'ივნისის', 'ივლისის', 'აგვისტოს', 'სექტემბრის', 'ოქტომბრის', 'ნოემბრის', 'დეკემბრის'],
        ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    };
    // The promo's end in Tbilisi time (UTC+4 all year), e.g. "18 ოქტომბრის 23:59".
    function formatPromoEnd(lang) {
        const d = new Date(Date.parse(PRICING.miniPromoEnds) + 4 * 3600 * 1000);
        const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        const day = d.getUTCDate(), month = MONTHS[lang][d.getUTCMonth()];
        return lang === 'en' ? `${month} ${day}, ${time}` : lang === 'ru' ? `${day} ${month}, ${time}` : `${day} ${month} ${time}`;
    }

    // The price, crossed-out regular price (Mini promo) and payment line a
    // card shows for one payment option ('onetime' | '5050' | '3mo').
    function cardPriceTexts(planId, option, lang, t) {
        const pkg = PRICING.packages[planId];
        const onPromo = pkg.promoPrice !== undefined && isMiniPromoActive();
        const amounts = paymentOptions(onPromo ? pkg.promoPrice : pkg.price);
        const shown = pkg.fixed ? 'onetime' : option;
        const period = (pkg.fixed || shown === '5050') ? t.plan5050Period
            : shown === '3mo' ? t.plan3moPeriod.replace('{rate}', Math.round(PRICING.threeMonthFeeRate * 100))
            : t.oneTimePayment;
        return {
            onPromo,
            price: formatGel(amounts[shown][0], lang),
            regular: formatGel(paymentOptions(pkg.price)[shown][0], lang),
            period,
            promoEnd: t.miniPromoUntil.replace('{date}', formatPromoEnd(lang)),
        };
    }
    // @pricing-end

    // Writes every card's price and payment line for the selected payment
    // option. `animate` (user-triggered changes): the changed labels fade in,
    // and a payment line whose height changes (1 line ↔ 2 lines) eases to its
    // new height so the cards grow/shrink smoothly instead of jumping.
    function renderPrices(lang, animate = false) {
        const t = translations[lang];
        const option = currentBillingPeriod === 'plans' ? currentPlanType : 'onetime';
        const changes = [];
        document.querySelectorAll('.pricing-card[data-plan-id]').forEach(card => {
            if (!PRICING.packages[card.dataset.planId]) return;
            const texts = cardPriceTexts(card.dataset.planId, option, lang, t);
            [['[data-price-point]', texts.price], ['[data-billing-period]', texts.period],
             ['[data-price-old]', texts.regular], ['[data-mini-deadline]', texts.promoEnd]].forEach(([selector, text]) => {
                const el = card.querySelector(selector);
                if (el && el.textContent !== text) changes.push({ el, text });
            });
            card.classList.toggle('promo-active', texts.onPromo);
        });
        if (animate && !reducedMotion()) animateTextChanges(changes);
        else changes.forEach(({ el, text }) => { el.textContent = text; });
        updatePromoCountdown(lang);
    }

    // Swaps several labels at once: reads every current height, writes all
    // the texts, reads the new heights (two layouts in total), then fades each
    // label in and eases the ones whose height changed.
    function animateTextChanges(changes) {
        changes.forEach(c => {
            c.from = c.el.getBoundingClientRect().height;
            c.el.getAnimations().forEach(a => a.cancel());
        });
        changes.forEach(c => { c.el.textContent = c.text; });
        changes.forEach(c => { c.to = c.el.getBoundingClientRect().height; });
        changes.forEach(({ el, from, to }) => {
            el.animate([
                { opacity: 0, translate: '0 6px' },
                { opacity: 1, translate: '0 0' }
            ], { duration: 320, easing: 'ease-out' });
            if (Math.abs(from - to) < 1) return;
            el.style.overflow = 'hidden';
            const resize = el.animate([{ height: `${from}px` }, { height: `${to}px` }],
                { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
            resize.onfinish = resize.oncancel = () => { el.style.overflow = ''; };
        });
    }

    // "Ends in 3d 4h" under the Mini promo; when the deadline passes while
    // the page is open, the cards switch to the regular price.
    function updatePromoCountdown(lang = currentLang) {
        const el = document.querySelector('[data-mini-countdown]');
        if (!el) return;
        const left = Date.parse(PRICING.miniPromoEnds) - Date.now();
        if (left <= 0) { el.textContent = ''; return; }
        const t = translations[lang];
        const days = Math.floor(left / 86400000), hours = Math.floor(left / 3600000) % 24, minutes = Math.floor(left / 60000) % 60;
        el.textContent = days > 0
            ? t.miniPromoLeftDays.replace('{d}', days).replace('{h}', hours)
            : t.miniPromoLeftHours.replace('{h}', hours).replace('{m}', minutes);
    }
    if (isMiniPromoActive()) {
        const promoClock = setInterval(() => {
            if (isMiniPromoActive()) { updatePromoCountdown(); return; }
            clearInterval(promoClock);
            renderPrices(currentLang, true);
        }, 30000);
    }


    const applyTranslations = (lang) => {
        document.body.setAttribute('data-lang', lang);
        document.documentElement.lang = lang === 'ge' ? 'ka' : lang;

        // The Georgian text is already baked into index.html (tools/prerender-ka.js),
        // so on a normal Georgian page load most elements already match — only
        // touch the ones that differ instead of re-creating ~150 DOM subtrees.
        const scratch = document.createElement('div');
        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.getAttribute('data-lang');
            if (translations[lang] && translations[lang][key]) {
                if (!element.hasAttribute('data-price-point') && !element.hasAttribute('data-billing-period')) {
                    scratch.innerHTML = translations[lang][key];
                    if (element.innerHTML !== scratch.innerHTML) {
                        element.innerHTML = translations[lang][key];
                    }
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

        renderPrices(lang);
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
                case 'Mini': planTitleKey = 'pricingMiniTitle'; break;
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

        setSubtoggleVisible(currentBillingPeriod === 'plans');
        syncToggleIndicator();

        if (currentBillingPeriod === 'individual') {
            swapCardsAfterFadeOut(standardCards, () => {
                pricingGrid.classList.add('individual-mode');
                standardCards.forEach(card => card.classList.add('hidden'));
                individualCard.classList.remove('hidden');
                revealCards([individualCard]);
            });
        } else {
            const showStandardCards = () => {
                const wasIndividual = pricingGrid.classList.contains('individual-mode');
                pricingGrid.classList.remove('individual-mode');
                standardCards.forEach(card => card.classList.remove('hidden'));
                individualCard.classList.add('hidden');
                if (wasIndividual) revealCards(standardCards);
                renderPrices(currentLang, !wasIndividual);
            };
            if (pricingGrid.classList.contains('individual-mode')) {
                swapCardsAfterFadeOut([individualCard], showStandardCards);
            } else {
                cancelCardSwap();
                showStandardCards();
            }
        }
    };

    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // A card sinks and fades out (the reverse of `revealCards`).
    const fadeOut = (card) => card.animate([
        { opacity: 1, translate: '0 0' },
        { opacity: 0, translate: '0 16px' }
    ], { duration: 220, easing: 'ease-in', fill: 'forwards' });

    // Tab switches to/from "Individual": the cards on screen fade out first,
    // then `swap` hides them and shows the other set (which rises in). A
    // newer click cancels a swap that hasn't happened yet.
    let pendingCardSwap = null;
    function cancelCardSwap() {
        pendingCardSwap?.forEach(fade => fade.cancel());
        pendingCardSwap = null;
    }
    function swapCardsAfterFadeOut(cards, swap) {
        cancelCardSwap();
        const visible = Array.from(cards).filter(card => card.offsetParent !== null);
        if (reducedMotion() || !visible.length) { swap(); return; }
        const fades = visible.map(fadeOut);
        pendingCardSwap = fades;
        Promise.all(fades.map(fade => fade.finished)).then(() => {
            if (pendingCardSwap !== fades) return;
            pendingCardSwap = null;
            swap();
            fades.forEach(fade => fade.cancel());
        }, () => {});
    }

    // Cards that were display:none fade and rise in, one after another.
    // (`translate`, not `transform`, so the Pro card keeps its scale.)
    function revealCards(cards) {
        if (reducedMotion()) return;
        Array.from(cards).forEach((card, i) => {
            card.animate?.([
                { opacity: 0, translate: '0 24px' },
                { opacity: 1, translate: '0 0' }
            ], { duration: 500, delay: i * 90, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
        });
    }

    // The 50/50 · 3-month · 6-month row opens by growing its height, so the
    // cards below glide down instead of jumping, and its buttons pop in.
    let subtoggleAnimation = null;
    function setSubtoggleVisible(show) {
        const row = document.getElementById('plan-subtoggle');
        if (!row) return;
        const isOpen = !row.hidden && !row.classList.contains('is-closing');
        if (show === isOpen) return;

        subtoggleAnimation?.cancel();
        row.classList.remove('is-closing');

        if (reducedMotion() || !row.animate) {
            row.hidden = !show;
            return;
        }

        row.hidden = false;
        const open = { height: `${row.scrollHeight}px`, marginBottom: getComputedStyle(row).marginBottom, opacity: 1 };
        const closed = { height: '0px', marginBottom: '0px', opacity: 0 };
        row.classList.add('is-animating');

        subtoggleAnimation = row.animate(show ? [closed, open] : [open, closed], {
            duration: show ? 420 : 300,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        });

        if (show) {
            row.querySelectorAll('.subtoggle-btn').forEach((btn, i) => {
                btn.animate([
                    { opacity: 0, translate: '0 -8px', scale: '0.9' },
                    { opacity: 1, translate: '0 0', scale: '1' }
                ], { duration: 360, delay: 80 + i * 70, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' });
            });
        } else {
            row.classList.add('is-closing');
        }

        const animation = subtoggleAnimation;
        animation.onfinish = () => {
            row.classList.remove('is-animating', 'is-closing');
            if (!show) row.hidden = true;
            subtoggleAnimation = null;
        };
        animation.oncancel = () => row.classList.remove('is-animating');
    }

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
            renderPrices(currentLang, true);
        });
    });

    afterFirstFrame(syncToggleIndicator);
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

            imagePreview.removeAttribute('src');
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
    const allItems = Array.from(document.querySelectorAll('.carousel-item'));
    const prevBtn = document.querySelector('.carousel-btn--prev');
    const nextBtn = document.querySelector('.carousel-btn--next');
    const dotsContainer = document.querySelector('.carousel-dots');
    const filterButtons = document.querySelectorAll('#portfolio .filter-btn');

    if (!track || !allItems.length) return;

    let visibleItems = allItems;
    let currentIndex = 0;
    let dots = [];
    let dotsTrack = null;
    let dotPitch = 0;

    const buildDots = () => {
        dotsContainer.innerHTML = '';
        dots = [];
        dotsTrack = document.createElement('div');
        dotsTrack.className = 'carousel-dots-track';
        dotsContainer.appendChild(dotsTrack);

        const total = visibleItems.length;
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Go to project ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsTrack.appendChild(dot);
            dots.push(dot);
        }
        if (!total) { dotsContainer.style.width = '0px'; return; }

        const VISIBLE_SLOTS = Math.min(5, total);
        const centerSlot = Math.min(Math.floor(VISIBLE_SLOTS / 2), total - 1);
        const restingDotWidth = dots[0].offsetWidth;
        const dotGap = parseFloat(getComputedStyle(dotsTrack).gap) || 0;
        dotPitch = restingDotWidth + dotGap;

        dots[centerSlot].style.transition = 'none';
        dots[centerSlot].classList.add('is-active');
        void dots[centerSlot].offsetWidth;

        const firstVisibleDot = dots[0];
        const lastVisibleDot = dots[VISIBLE_SLOTS - 1];
        const measuredSpan =
            (lastVisibleDot.offsetLeft + lastVisibleDot.offsetWidth) - firstVisibleDot.offsetLeft;

        dots[centerSlot].classList.remove('is-active');
        void dots[centerSlot].offsetWidth;
        dots[centerSlot].style.transition = '';

        const TRAILING_BUFFER = 23;
        dotsContainer.style.width = `${Math.ceil(measuredSpan) + TRAILING_BUFFER}px`;
    };

    const syncDots = () => {
        const total = visibleItems.length;
        if (!dots.length) return;
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === currentIndex));

        const VISIBLE_SLOTS = Math.min(5, total);
        let steps = 0;
        if (total > VISIBLE_SLOTS) {
            if (currentIndex <= 1) steps = 0;
            else if (currentIndex >= total - 2) steps = total - VISIBLE_SLOTS;
            else steps = currentIndex - 2;
        }
        dotsTrack.style.transform = `translateX(${-(steps * dotPitch)}px)`;
    };

    const goTo = (index) => {
        const total = visibleItems.length;
        if (!total) return;
        currentIndex = Math.max(0, Math.min(index, total - 1));

        const wrapperWidth = track.parentElement.offsetWidth;
        const itemWidth = visibleItems[currentIndex].offsetWidth;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const offset = (currentIndex * (itemWidth + gap)) - (wrapperWidth / 2) + (itemWidth / 2);
        track.style.transform = `translateX(${-offset}px)`;

        visibleItems.forEach((item, i) => item.classList.toggle('is-active', i === currentIndex));
        syncDots();

        prevBtn.style.opacity = currentIndex === 0 ? "0" : "1";
        prevBtn.style.pointerEvents = currentIndex === 0 ? "none" : "auto";
        nextBtn.style.opacity = currentIndex === total - 1 ? "0" : "1";
        nextBtn.style.pointerEvents = currentIndex === total - 1 ? "none" : "auto";

        loadNeighbours();
    };

    // Card images have no `src` in the HTML (only `data-src`): with native
    // lazy-loading, browsers fetched them during page load (their look-ahead
    // distance reaches the carousel), competing with the first screen.
    // Instead they start right after the page has loaded, once the browser
    // is idle (or earlier, if the carousel comes within ~2 screens first):
    // the active card and two neighbours on each side, so they are ready
    // before the section scrolls in and no card slides in empty. They're
    // small, self-hosted WebP files (assets/img/portfolio/).
    let carouselImagesAllowed = false;
    function loadNeighbours() {
        if (!carouselImagesAllowed) return;
        for (let i = currentIndex - 2; i <= currentIndex + 2; i++) {
            const img = visibleItems[i] && visibleItems[i].querySelector('img[data-src]');
            if (img && !img.getAttribute('src')) img.src = img.dataset.src;
        }
    }
    const allowCarouselImages = () => {
        if (carouselImagesAllowed) return;
        carouselImagesAllowed = true;
        loadNeighbours();
    };
    const allowWhenIdle = () => {
        if ('requestIdleCallback' in window) requestIdleCallback(allowCarouselImages, { timeout: 2000 });
        else setTimeout(allowCarouselImages, 1000);
    };
    if (document.readyState === 'complete') allowWhenIdle();
    else window.addEventListener('load', allowWhenIdle, { once: true });
    new IntersectionObserver((entries, observer) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        allowCarouselImages();
        observer.disconnect();
    }, { rootMargin: '1500px 0px' }).observe(track.parentElement);

    const applyFilter = (filter) => {
        allItems.forEach(item => {
            const matches = filter === 'all' || item.getAttribute('data-category') === filter;
            item.style.display = matches ? '' : 'none';
            item.classList.remove('is-active');
        });
        visibleItems = filter === 'all' ? allItems : allItems.filter(item => item.getAttribute('data-category') === filter);
        currentIndex = 0;
        buildDots();
        requestAnimationFrame(() => goTo(0));
    };

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('is-default');
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
            });
            applyFilter(btn.getAttribute('data-filter'));
        });
    });

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

    let touchStartX = 0, touchDelta = 0;
    track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
        touchDelta = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(touchDelta) > 50) touchDelta > 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
    }, { passive: true });

    window.addEventListener('resize', () => goTo(currentIndex));

    applyFilter('client');
};

    afterFirstFrame(initPortfolioCarousel);


    // ================================
    // GSAP SCROLL REVEAL — PORTFOLIO
    // Staggered, hardware-accelerated entrance for every carousel card
    // as the section scrolls into view. `clearProps` hands control back
    // to the CSS is-active/hover rules the instant the tween settles, so
    // it never fights the carousel's own opacity/scale logic afterward.
    // Triggered by an IntersectionObserver when #portfolio's top reaches
    // 80% of the viewport height (what ScrollTrigger's `start: 'top 80%'`
    // did) — ScrollTrigger re-measured the whole page on load for this one
    // effect, which was the biggest blocking task left on mobile.
    // ================================
    const initPortfolioScrollReveal = () => {
        const items = document.querySelectorAll('.carousel-item');
        const section = document.getElementById('portfolio');
        if (!items.length || !section) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (typeof gsap === 'undefined' || !('IntersectionObserver' in window)) return;

        // Paused `from` tween: renders the hidden start state immediately,
        // plays once the trigger point is reached.
        const reveal = gsap.from(items, {
            opacity: 0,
            y: 40,
            scale: 0.94,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.1,
            clearProps: 'opacity,transform',
            paused: true
        });

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[entries.length - 1];
            // Also play if the page opened already scrolled past the section.
            if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight * 0.8) {
                reveal.play();
                observer.disconnect();
            }
        }, { rootMargin: '0px 0px -20% 0px' });
        observer.observe(section);
    };

    afterFirstFrame(initPortfolioScrollReveal);

    // ================================
    // WORKS PAGE — example sites per package ("See Works" on the pricing
    // cards). A virtual page like the contact/review pages: the button is a
    // nav-link to #works-page, and its data-tier picks the tab. Screenshots
    // load only once the page is open. Premium has no examples yet, so its
    // button shows a short "coming soon" bubble instead.
    // ================================
    (function initWorksPage() {
        const view = document.getElementById('works-page-view');
        if (!view) return;
        const tabs = view.querySelectorAll('.works-filter .filter-btn');
        const cards = view.querySelectorAll('.work-card');
        let tier = 'Starter';

        function showTier(next, animate) {
            tier = next;
            tabs.forEach(tab => {
                const on = tab.dataset.tier === tier;
                tab.classList.toggle('active', on);
                tab.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            const shown = [];
            cards.forEach(card => {
                card.hidden = card.dataset.tier !== tier;
                if (!card.hidden) shown.push(card);
            });
            if (!view.classList.contains('active')) return;
            shown.forEach(card => {
                const img = card.querySelector('img[data-src]');
                if (img) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
            });
            if (!animate || reducedMotion()) return;
            shown.forEach((card, i) => card.animate([
                { opacity: 0, translate: '0 18px' },
                { opacity: 1, translate: '0 0' }
            ], { duration: 450, delay: Math.min(i, 8) * 50, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }));
        }

        tabs.forEach(tab => tab.addEventListener('click', () => {
            if (tab.dataset.tier !== tier) showTier(tab.dataset.tier, true);
        }));
        view.addEventListener('view:shown', () => showTier(tier, true));

        let soonTimer = null;
        function showComingSoon(button) {
            const bubble = button.parentElement.querySelector('.see-works-soon');
            if (!bubble) return;
            bubble.textContent = translations[currentLang].seeWorksSoon;
            bubble.classList.add('is-visible');
            clearTimeout(soonTimer);
            soonTimer = setTimeout(() => bubble.classList.remove('is-visible'), 2600);
        }

        // Runs before the page switch (this listener is on the button, the
        // navigation one on the document), so the right tab is ready.
        document.querySelectorAll('.see-works-btn[data-tier]').forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.dataset.tier === 'Premium') { e.preventDefault(); showComingSoon(button); return; }
                showTier(button.dataset.tier, false);
            });
        });

        showTier(tier, false);
    })();


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

        document.querySelectorAll('.btn-primary, .btn-secondary, .filter-btn, .subtoggle-btn').forEach(btn => {
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
        let rafId = null;

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

            // Once the camera has caught up (sub-pixel), snap and stop the
            // loop instead of re-writing the same transform every frame;
            // the next scroll/resize wakes it again.
            const settled = Math.abs(targetX - currentX) < 0.05
                && Math.abs(targetY - currentY) < 0.05
                && Math.abs(targetScale - currentScale) < 0.00005;
            if (settled) {
                currentX = targetX; currentY = targetY; currentScale = targetScale;
            }

            bgImage.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;
            rafId = settled ? null : requestAnimationFrame(tick);
        }

        function wake() {
            computeTarget();
            if (rafId === null) rafId = requestAnimationFrame(tick);
        }

        // First frame keeps the CSS fallback transform; start once it's rendered
        // (computeTarget reads scrollHeight, which would force a layout now).
        afterFirstFrame(wake);

        window.addEventListener('scroll', wake, { passive: true });
        window.addEventListener('resize', wake);
        window.addEventListener('pagehide', function () {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = null;
            window.removeEventListener('scroll', wake);
            window.removeEventListener('resize', wake);
        });
    })();


    // ================================
    // HERO VIDEO (mobile only)
    // The <video> ships without a source: on desktop it's hidden, so it
    // shouldn't download at all, and on phones it shouldn't compete with
    // the CSS, fonts and images needed for the first screen. It's attached
    // once the page has loaded — the clip opens on black and fades in, so
    // it blends straight into the dark hero background.
    // Full 1080p: HEVC where the phone can play it (iPhones, most Android
    // phones; about 30% smaller at the same quality), H.264 otherwise.
    // ================================
    (function initHeroVideo() {
        const video = document.getElementById('hero-video');
        if (!video || !video.dataset.src) return;
        // Exact complement of the `min-width: 768px` rule that hides it in style.css.
        const mobile = window.matchMedia('not all and (min-width: 768px)');

        const attach = () => {
            if (video.getAttribute('src') || !mobile.matches) return;
            const hevc = video.dataset.srcHevc && video.canPlayType('video/mp4; codecs="hvc1.1.6.L123.B0"');
            video.src = hevc ? video.dataset.srcHevc : video.dataset.src;
            const playing = video.play();
            if (playing) playing.catch(() => {});
        };
        const attachAfterLoad = () => {
            if (document.readyState === 'complete') attach();
            else window.addEventListener('load', attach, { once: true });
        };

        attachAfterLoad();
        mobile.addEventListener('change', attachAfterLoad);
    })();
});
