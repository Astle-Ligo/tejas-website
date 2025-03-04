// // Mobile menu toggle
// document.addEventListener('DOMContentLoaded', function () {
//     const menuToggle = document.getElementById('menu-toggle');
//     const mobileMenu = document.getElementById('mobile-menu');
//     const mobileLinks = document.querySelectorAll('.mobile-link');

//     if (menuToggle && mobileMenu) {
//         menuToggle.addEventListener('click', function () {
//             mobileMenu.classList.toggle('hidden');
//         });

//         mobileLinks.forEach(link => {
//             link.addEventListener('click', function () {
//                 mobileMenu.classList.add('hidden');
//             });
//         });
//     }

//     // Parallax effect for background
//     const parallaxBg = document.getElementById('parallax-bg');

//     if (parallaxBg) {
//         window.addEventListener('scroll', function () {
//             const scrollY = window.scrollY;
//             parallaxBg.style.transform = `translateY(${scrollY * 0.2}px)`;
//         });
//     }

//     // Tilt effect for card
//     const tiltCard = document.querySelector('.tilt-card');

//     if (tiltCard) {
//         tiltCard.addEventListener('mousemove', function (e) {
//             const cardRect = tiltCard.getBoundingClientRect();
//             const cardCenterX = cardRect.left + cardRect.width / 2;
//             const cardCenterY = cardRect.top + cardRect.height / 2;

//             const mouseX = e.clientX - cardCenterX;
//             const mouseY = e.clientY - cardCenterY;

//             const rotateY = mouseX * 0.01;
//             const rotateX = -mouseY * 0.01;

//             tiltCard.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
//         });

//         tiltCard.addEventListener('mouseleave', function () {
//             tiltCard.style.transform = 'rotateY(0deg) rotateX(0deg)';
//         });
//     }

//     // Form submission
//     const registerForm = document.querySelector('.register-form');
//     const registerBtn = document.getElementById('register-btn');

//     if (registerForm && registerBtn) {
//         registerBtn.addEventListener('click', function (e) {
//             e.preventDefault();

//             const nameInput = document.getElementById('name');
//             const emailInput = document.getElementById('email');
//             const institutionInput = document.getElementById('institution');

//             // Simple validation
//             let isValid = true;

//             if (!nameInput.value.trim()) {
//                 nameInput.style.borderColor = 'red';
//                 isValid = false;
//             } else {
//                 nameInput.style.borderColor = '';
//             }

//             if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
//                 emailInput.style.borderColor = 'red';
//                 isValid = false;
//             } else {
//                 emailInput.style.borderColor = '';
//             }

//             if (!institutionInput.value.trim()) {
//                 institutionInput.style.borderColor = 'red';
//                 isValid = false;
//             } else {
//                 institutionInput.style.borderColor = '';
//             }

//             if (isValid) {
//                 // Simulate form submission
//                 registerBtn.textContent = 'Registering...';
//                 registerBtn.disabled = true;

//                 setTimeout(() => {
//                     registerForm.innerHTML = `
//               <div class="text-center py-8">
//                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-coffee mb-4">
//                   <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
//                   <polyline points="22 4 12 14.01 9 11.01"></polyline>
//                 </svg>
//                 <h3 class="text-2xl font-bold text-coffee mb-4">Registration Successful!</h3>
//                 <p class="text-lg text-bistre mb-6">Thank you for registering for Tejas '25. We'll be in touch with more details soon.</p>
//                 <p class="text-md text-chamoisee">A confirmation email has been sent to your inbox.</p>
//               </div>
//             `;
//                 }, 1500);
//             }
//         });
//     }

//     // Smooth scrolling for anchor links
//     document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//         anchor.addEventListener('click', function (e) {
//             e.preventDefault();

//             const targetId = this.getAttribute('href');
//             const targetElement = document.querySelector(targetId);

//             if (targetElement) {
//                 window.scrollTo({
//                     top: targetElement.offsetTop - 80, // Adjust for fixed header
//                     behavior: 'smooth'
//                 });
//             }
//         });
//     });
// });