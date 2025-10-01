
import React from 'react';
import { InstagramIcon } from './icons/InstagramIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';

const faqs = [
    {
        question: "How do I earn rewards?",
        answer: "Simply watch ads from our partners. Once you finish watching an ad, you can claim your points, which are added to your balance."
    },
    {
        question: "How can I redeem my points?",
        answer: "You can redeem your points for various rewards in the 'You' section of your dashboard. Options include gift cards, discounts, and more."
    },
    {
        question: "Adssimsim Advertising free to use for viewers?",
        answer: "Yes, it's completely free for viewers! You get paid in points to watch content from brands you might like."
    },
    {
        question: "How do I create an ad campaign as an advertiser?",
        answer: "Click the 'Launch Campaign' button on the homepage, sign in or create an advertiser account, and you'll be taken to your dashboard where you can create and manage your campaigns."
    },
    {
        question: "Who can I contact for support?",
        answer: "For any support queries, please reach out to us via email, phone, or our social media channels listed below."
    }
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-gray-400 border-t border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center text-white mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <details key={index} className="bg-charcoal p-4 rounded-lg group">
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