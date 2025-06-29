document.addEventListener('DOMContentLoaded', () => {

    // ================================
    // FULLY UPGRADED SPA NAVIGATOR with History API
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

                e.preventDefault();
                const targetId = navLink.hash;
                const isMobileClick = e.target.closest('.mobile-nav-links');

                if (isMobileClick && this.elements.body.classList.contains('mobile-nav-is-open')) {
                    closeMobileMenu();
                    setTimeout(() => this.switchView(targetId), 400);
                } else {
                    this.switchView(targetId);
                }
            });

            window.addEventListener('popstate', (e) => {
                const targetId = e.state ? e.state.target : '#hero';
                this.switchView(targetId, true); 
            });
        },

        switchView(targetId, isPopState = false) {
            if (!isPopState) {
                if(window.location.hash !== targetId) {
                   history.pushState({ target: targetId }, '', targetId);
                }
            }

            const isPageView = targetId.includes('-page');

            this.elements.pageViews.forEach(view => view.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active-link'));

            if (isPageView) {
                this.elements.body.classList.add('virtual-page-active');
                const targetView = document.getElementById(targetId.substring(1) + '-view');
                if (targetView) targetView.classList.add('active');
                window.scrollTo(0, 0); 
            } else {
                this.elements.body.classList.remove('virtual-page-active');
                this.elements.mainContentView.classList.add('active');
                this.elements.mainContentView.classList.add('hidden'); 

                setTimeout(() => {
                    const targetSection = document.querySelector(targetId);
                    if (targetSection) {
                         const headerOffset = document.querySelector('header').offsetHeight;
                         const elementPosition = targetSection.getBoundingClientRect().top;
                         const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                         window.scrollTo({
                             top: offsetPosition,
                             behavior: 'auto'
                         });
                    }
                    this.elements.mainContentView.classList.remove('hidden');
                }, 50); 
            }

             document.querySelectorAll(`.nav-link[href="${targetId}"]`).forEach(link => link.classList.add('active-link'));
        },


        _setupScrollSpy() {
            const sections = this.elements.mainContentView.querySelectorAll('section[id]');
            this.scrollObserver = new IntersectionObserver((entries) => {
                if (this.elements.body.classList.contains('virtual-page-active')) return;

                let activeSectionId = '';
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        activeSectionId = entry.target.id;
                    }
                });
                
                if (activeSectionId) {
                    history.replaceState({ target: `#${activeSectionId}` }, '', `#${activeSectionId}`);
                    document.querySelectorAll('.nav-link').forEach(link => {
                       link.classList.toggle('active-link', link.hash === `#${activeSectionId}`);
                   });
                }

            }, { threshold: 0.5 });

            sections.forEach(section => this.scrollObserver.observe(section));
        },
        _handleInitialLoad() {
            const initialHash = window.location.hash || '#hero';
            this.switchView(initialHash, true);
        }
    };

    // ================================
    // AOS INIT
    // ================================
    AOS.init({ duration: 800, once: true, offset: 50 });

    // ================================
    // MOBILE NAVIGATION
    // ================================
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const bodyEl = document.body;

    const openMobileMenu = () => bodyEl.classList.add('mobile-nav-is-open');
    const closeMobileMenu = () => bodyEl.classList.remove('mobile-nav-is-open');

    document.getElementById('hamburger-menu')?.addEventListener('click', openMobileMenu);
    document.getElementById('close-mobile-menu')?.addEventListener('click', closeMobileMenu);
    mobileNavOverlay?.addEventListener('click', closeMobileMenu);

    // ================================
    // LANGUAGE SWITCHER
    // ================================
    const translations = {
        en: { pageTitle: "OSGWeb.ge - Websites That Grow Your Business", pageDescription: "Websites That Work For You", navServices: "Services", navPortfolio: "Portfolio", navTestimonials: "Testimonials", navContact: "Contact", navReview: "Leave a Review", noMoreReviews: "No More Reviews", heroTitle: "Your Business,<br><span class='gradient-text'>Digitally</span>", heroSubtitle: "Websites That Work For You", heroButton: "Start a Project", servicesTitle: "Our Goal Is Your Success", service1Title: "Design", service1Desc: "A technically sound website is not enough — the visual impression decides whether the user stays. The design should be modern, easy to understand, and tailored to the brand.", service2Title: "Security", service2Desc: "User trust begins with website security. Modern protection mechanisms ensure defense against hacking attacks, data leaks, and other threats.", service3Title: "Easy Management", service3Desc: "An intuitive system lets you easily change texts, add images, and customize the site to your needs — without coding knowledge.", portfolioTitle: "Featured Works", portfolio1Title: "'The Golden Fork' - Restaurant Website", portfolio2Title: "'The Trim House' - Barbershop Branding", portfolio3Title: "'Olio & Sale' - Cafe Online Website", testimonialsTitle: "Reviews and Testimonials", contactTitle: "Contact Us", contactInfoTitle: "Contact Information", contactInfoDesc: "Have a project or question? Write to us, call us, or fill out the form.", contactInfoLocation: "Tbilisi, Georgia", formNamePlaceholder: "Your Name", formEmailPlaceholder: "Your Email", formMessagePlaceholder: "Your Message", formSendButton: "Send", footerAbout: "Innovative digital experience for brand success.", footerLinksTitle: "Quick Links", footerContactTitle: "Contact Us", footerSocialTitle: "Follow Us", footerCopyright: "© 2025 OSGWeb.ge. All rights reserved.", reviewPageTitle: "Leave a Review", reviewPageSubtitle: "Your feedback helps us become even better.", formFullNamePlaceholder: "Full Name", formCompanyPlaceholder: "Company (Optional)", formWebsitePlaceholder: "Website We Built For You", reviewFormRatingLabel: "Your Rating:", reviewFormMessagePlaceholder: "Write your review here...", reviewFormSubmitButton: "Submit Review", reviewSuccessTitle: "Thank You!", formLogoPlaceholder: "Company Logo (Optional)", reviewSuccessMessage: "Your review has been submitted and will be published after we confirm your project.", noReviewsMessage: "No reviews yet, Be the first to leave a review!", reviewPendingTitle: "Review Pending", reviewPendingMessage: "Your review will be published after we confirm your project.", },
        ka: { pageTitle: "OSGWeb.ge - ვებსაიტები, რომელიც ბიზნესს ზრდის", pageDescription: "ვებსაიტები, რომლებიც მუშაობენ თქვენთვის", navServices: "სერვისები", navPortfolio: "პორტფოლიო", navTestimonials: "შეფასებები", navContact: "კონტაქტი", navReview: "შეფასების დატოვება", noMoreReviews: "მეტი შეფასება არ არის", heroTitle: "შენი ბიზნესი,<br><span class='gradient-text'>ციფრულად</span>", heroSubtitle: "ვებსაიტები, რომლებიც მუშაობენ თქვენთვის", heroButton: "პროექტის დაწყება", servicesTitle: "ჩვენი მიზანია შენი წარმატება", service1Title: "დიზაინი", service1Desc: "ტექნიკურად გამართული საიტი საკმარისი არაა — ვიზუალური შთაბეჭდილება გადაწყვიტავს, დარჩება თუ არა მომხმარებელი. დიზაინი უნდა იყოს თანამედროვე, მარტივად აღსაქმელი და ბრენდზე მორგებული.", service2Title: "უსაფრთხოება", service2Desc: "მომხმარებლის ნდობა იწყება საიტის უსაფრთხოებით. თანამედროვე დაცვით მექანიზმებს უზრუნველყოფს ჰაკერული თავდასხმების, მონაცემთა გაჟონვის და სხვა საფრთხეებისგან დაცვას.", service3Title:"მარტივი მართვა",  service3Desc: "ინტუიციური სისტემა საშუალებას გაძლევთ მარტივად შეცვალოთ ტექსტები, დაამატოთ სურათები და მოარგოთ საიტი თქვენს საჭიროებებს — კოდის ცოდნის გარეშე.", portfolioTitle: "გამორჩეული ნამუშევრები", portfolio1Title: "'The Golden Fork' - რესტორნის ვებსაიტი", portfolio2Title: "'The Trim House' - ბარბერშოპის ბრენდინგი", portfolio3Title: "'Olio & Sale' - კაფეს ონლაინ ვებსაიტი", testimonialsTitle: "მიმოხილვები და შეფასებები", contactTitle: "დაგვიკავშირდით", contactInfoTitle: "საკონტაქტო ინფორმაცია", contactInfoDesc: "გაქვთ პროექტი ან შეკითხვა? მოგვწერეთ, დაგვირეკეთ, ან შეავსეთ ფორმა.", contactInfoLocation: "თბილისი, საქართველო", formNamePlaceholder: "თქვენი სახელი", formEmailPlaceholder: "თქვენი ელ. ფოსტა", formMessagePlaceholder: "თქვენი შეტყობინება", formSendButton: "გაგზავნა", footerAbout: "ინოვაციური ციფრული გამოცდილება ბრენდების წარმატებისთვის.", footerLinksTitle: "სწრაფი ბმულები", footerContactTitle: "დაგვიკავშირდით", footerSocialTitle: "გამოგვყევით", footerCopyright: "© 2025 OSGWeb.ge. ყველა უფლება დაცულია.", reviewPageTitle: "შეფასების დატოვება", reviewPageSubtitle: "თქვენი შეფასება გვეხმარება გავხდეთ უკეთესები.", formFullNamePlaceholder: "სრული სახელი", formCompanyPlaceholder: "კომპანია (სურვილისამებრ)", formLogoPlaceholder: "კომპანიის ლოგო (სურვილისამებრ)", formWebsitePlaceholder: "ვებსაიტი რომელიც თქვენთვის ავაწყვეთ", reviewFormRatingLabel: "თქვენი შეფასება:", reviewFormMessagePlaceholder: "დაწერეთ თქვენი შეფასება აქ...", reviewFormSubmitButton: "შეფასების გაგზავნა", reviewSuccessTitle: "მადლობა!", reviewSuccessMessage: "თქვენი შეფასება გაგზავნილია და პროექტის დადასტურებისთანავე გამოქვეყნდება.", noReviewsMessage: "შეფასებები არ არის.", reviewPendingTitle: "შეფასება მიღებულია", reviewPendingMessage: "თქვენი შეფასება გამოქვეყნდება პროექტის დადასტურებისთანავე.", },
        ru: { pageTitle: "OSGWeb.ge - Веб-сайты, развивающие ваш бизнес", pageDescription: "Веб-сайты, которые работают на вас", navServices: "Услуги", navPortfolio: "Портфолио", navTestimonials: "Отзывы", navContact: "Контакты", navReview: "Оставить отзыв", noMoreReviews: "Больше отзывов нет", heroTitle: "Ваш бизнес,<br><span class='gradient-text'>в цифре</span>", heroSubtitle: "Веб-сайты, которые работают на вас", heroButton: "Начать проект", servicesTitle: "Наша цель — ваш успех", service1Title: "Дизайн", service1Desc: "Технически грамотного сайта недостаточно — первое впечатление визуальное. Дизайн должен быть современным, понятным и соответствовать бренду.", service2Title: "Безопасность", service2Desc: "Доверие пользователей начинается с безопасности. Современные технологии защищают от взломов, утечек и других угроз.", service3Title: "Управление", service3Desc: "Интуитивная система позволяет легко редактировать тексты, добавлять изображения и адаптировать сайт под свои нужды — без навыков программирования.", portfolioTitle: "Избранные проекты", portfolio1Title: "'The Golden Fork' — сайт ресторана", portfolio2Title: "'The Trim House' — брендинг барбершопа", portfolio3Title: "'Olio & Sale' — Интернет-сайт кафе", testimonialsTitle: "Отзывы и мнения", contactTitle: "Связаться с нами", contactInfoTitle: "Контактная информация", contactInfoDesc: "Есть проект или вопрос? Напишите нам, позвоните или заполните форму.", contactInfoLocation: "Тбилиси, Грузия", formNamePlaceholder: "Ваше имя", formEmailPlaceholder: "Ваш email", formMessagePlaceholder: "Ваше сообщение", formSendButton: "Отправить", footerAbout: "Инновационный цифровой опыт для успеха бренда.", footerLinksTitle: "Быстрые ссылки", footerContactTitle: "Контакты", footerSocialTitle: "Мы в соцсетях", footerCopyright: "© 2025 OSGWeb.ge. Все права защищены.", reviewPageTitle: "Оставить отзыв", reviewPageSubtitle: "Ваш отзыв помогает нам становиться лучше.", formFullNamePlaceholder: "Полное имя", formCompanyPlaceholder: "Компания (необязательно)", formWebsitePlaceholder: "Сайт, который мы сделали для вас", reviewFormRatingLabel: "Ваша оценка:", reviewFormMessagePlaceholder: "Напишите ваш отзыв здесь...", reviewFormSubmitButton: "Отправить отзыв", reviewSuccessTitle: "Спасибо!", formLogoPlaceholder: "Добавить логотип компании (необязательно)", reviewSuccessMessage: "Ваш отзыв отправлен и будет опубликован после подтверждения проекта.", noReviewsMessage: "Пока отзывов нет. Будьте первым!", reviewPendingTitle: "Отзыв на проверке", reviewPendingMessage: "Ваш отзыв будет опубликован после подтверждения проекта." }
    };
    let currentLanguage = 'ka';

    const setLanguage = (lang) => {
        if (!translations[lang]) return;
        currentLanguage = lang;
        Object.keys(translations[lang]).forEach(key => {
            document.querySelectorAll(`[data-lang="${key}"]`).forEach(el => el.innerHTML = translations[lang][key]);
            document.querySelectorAll(`[data-lang-placeholder="${key}"]`).forEach(el => el.setAttribute('placeholder', translations[lang][key]));
            document.querySelectorAll(`[data-lang-meta="${key}"]`).forEach(el => el.setAttribute('content', translations[lang][key]));
        });
        document.documentElement.lang = lang;
        localStorage.setItem('userLanguage', lang);
        document.getElementById('current-lang-btn').textContent = lang.toUpperCase();
        document.querySelectorAll('.mobile-lang-switcher button').forEach(btn => {
            btn.classList.toggle('active-lang', btn.getAttribute('data-lang-value') === lang);
        });
        displayReviews([]);
    };

    const languageSelector = document.querySelector('.language-selector');
    const languageOptions = document.getElementById('language-options');
    languageSelector?.addEventListener('click', (e) => {
        e.stopPropagation();
        languageOptions.classList.toggle('active');
        languageSelector.classList.toggle('active');
        const langValue = e.target.getAttribute('data-lang-value');
        if (langValue) setLanguage(langValue);
    });
    document.addEventListener('click', () => {
        languageOptions?.classList.remove('active');
        languageSelector?.classList.remove('active');
    });

    document.getElementById('mobile-nav-panel')?.addEventListener('click', (e) => {
        const langButton = e.target.closest('.mobile-lang-switcher button');
        if (langButton) {
            const lang = langButton.getAttribute('data-lang-value');
            if (lang) {
                setLanguage(lang);
            }
        }
    });

        // ================================
    // CUSTOM FILE INPUT UX
    // ================================
// ================================
// ADVANCED FILE INPUT & PREVIEW UX
// ================================
const logoUploadWrapper = document.getElementById('logo-upload-wrapper');
const reviewLogoInput = document.getElementById('review-logo');
const previewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const uploadLabel = logoUploadWrapper?.querySelector('.file-upload-label');

let objectUrl; 

reviewLogoInput?.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        
        objectUrl = URL.createObjectURL(file);
        imagePreview.src = objectUrl;

        logoUploadWrapper.classList.add('preview-visible');
    }
});

removeImageBtn?.addEventListener('click', function() {
    reviewLogoInput.value = '';

    logoUploadWrapper.classList.remove('preview-visible');
    
    URL.revokeObjectURL(objectUrl);
    imagePreview.src = '#';
});

    // ================================
    // REVIEW SYSTEM
    // ================================
    // ================================
// REVIEW SYSTEM
// ================================
const displayReviews = (reviews = []) => {
    const reviewListContainer = document.getElementById('review-list');
    if (!reviewListContainer) return;

    if (reviews.length > 0) {
        reviewListContainer.innerHTML = reviews.map(r => '...').join('');
    } 
    else if (reviewListContainer.innerHTML.trim() === '') {
        reviewListContainer.innerHTML = `<div class="no-reviews-message"><p>${translations[currentLanguage].noReviewsMessage}</p></div>`;
    }
};
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const form = e.target, data = new FormData(form);
            try {
                const res = await fetch(form.action, { method: form.method, body: data, headers: { 'Accept': 'application/json' }});
                if (res.ok) {
                    document.getElementById('review-form-wrapper').style.display = 'none';
                    document.getElementById('review-success-message').style.display = 'block';
                    form.reset();
                } else throw new Error('Form submission failed');
            } catch (error) {
                console.error('Submission error:', error);
                alert('Could not submit the form. Please check your internet connection.');
            }
        });
    }
    
    // ================================
    // INITIALIZATION
    // ================================
    SpaNavigator.init();
    setLanguage(localStorage.getItem('userLanguage') || 'ka');
});