import React from 'react';
import { InstagramIcon } from './icons/InstagramIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';

const faqs = [
    {
        question: "What is this cashback program?",
        answer: "We believe in rewarding our customers directly. Instead of spending on traditional advertising, we transfer the marketing budget to you as cashback whenever you shop through our platform."
    },
    {
        question: "How does it work?",
        answer: "It’s simple: Browse the offers and click on a product/service link. Complete your purchase on the partner company’s official website. Once your payment is confirmed, cashback is credited to your account."
    },
    {
        question: "Is the cashback real money?",
        answer: "Yes. The cashback you earn is real money. You can withdraw it directly to your bank/UPI account or use it as wallet balance, depending on your preference."
    },
    {
        question: "How much cashback can I earn?",
        answer: "Cashback rates vary depending on the product, service, or campaign. Each offer clearly shows the percentage or amount you’ll receive before you make a purchase."
    },
    {
        question: "When will I receive my cashback?",
        answer: "Most cashbacks are credited within 24–72 hours of purchase confirmation. In some cases, especially for returns or order verifications, it may take up to 7 working days."
    },
    {
        question: "Are there any limits on cashback?",
        answer: "Yes, some campaigns may have daily, monthly, or per-transaction limits. These limits will always be mentioned in the offer details."
    },
    {
        question: "Who is eligible for cashback?",
        answer: "All registered users who make a purchase through our platform are eligible. Some campaigns may be exclusive to new customers or specific regions—these details will be mentioned clearly."
    },
    {
        question: "Do I need to sign up?",
        answer: "Yes. You must create a free account and verify your mobile/email so we can track your cashback and transfer the reward securely."
    },
    {
        question: "Can I earn cashback on every purchase?",
        answer: "Cashback is available only on products and services listed on our platform. If a product is not listed, it will not qualify for cashback."
    },
    {
        question: "How is this different from regular discounts?",
        answer: "Discounts reduce the price at checkout. Our cashback model rewards you after purchase by giving you a share of the marketing budget directly."
    },
    {
        question: "Is this safe and legal?",
        answer: "Absolutely. All transactions are secure, and cashback transfers are 100% legal. We comply with financial and data-privacy regulations to ensure your safety."
    },
    {
        question: "What if I don’t receive my cashback?",
        answer: "If your cashback doesn’t appear within the expected time, you can raise a support ticket from your account dashboard. Our team will track and resolve it quickly."
    },
    {
        question: "Can I combine cashback with other offers?",
        answer: "Yes, in most cases you can. However, some campaigns may restrict combining with coupons or discounts. Check the offer details before purchase."
    },
    {
        question: "What if I return or cancel my order?",
        answer: "If your order is cancelled or returned, the cashback for that transaction will not be credited or will be reversed if already paid."
    }
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-gray-400 border-t border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* FAQ Section */}
        <div className="max-w-7xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center text-white mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {faqs.map((faq, index) => (
                    <details key={index} className="bg-charcoal p-4 rounded-lg group h-fit">
                        <summary className="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
                            {faq.question}
                            <span className="transform transition-transform duration-300 group-open:rotate-180">
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </summary>
                        <p className="text-gray-300 mt-2">{faq.answer}</p>
                    </details>
                ))}
            </div>
        </div>

        {/* Contact Info Section */}
        <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
            <div className="flex justify-center items-center gap-6 flex-wrap">
                <a href="mailto:support@adssimsim.com" className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                    <MailIcon className="h-6 w-6" />
                    <span>support@adssimsim.com</span>
                </a>
                <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                    <PhoneIcon className="h-6 w-6" />
                    <span>+1 (234) 567-890</span>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                    <InstagramIcon className="h-6 w-6" />
                    <span>@adssimsim</span>
                </a>
            </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Adssimsim Advertising. All rights reserved. Powered by Gemini.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;