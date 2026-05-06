import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PageSeo from "@/components/seo/PageSeo";
import { routeMeta } from "@/seo/seoConfig";

const PAGES = {
    about: { 
        title: "About OmniShop", 
        content: (
            <>
                <p className="lead">Welcome to <strong>OmniShop</strong>, India's most trusted and rapidly growing e-commerce destination. Our mission is to democratize online shopping for everyone, everywhere.</p>
                <h3>Our Vision</h3>
                <p>We believe in a world where access to high-quality products is not a privilege, but a right. OmniShop was founded on the principle of bringing the marketplace to your doorstep with zero friction, uncompromising security, and lightning-fast delivery.</p>
                <h3>Why Choose Us?</h3>
                <ul>
                    <li><strong>100% Secure Payments:</strong> Backed by enterprise-grade encryption.</li>
                    <li><strong>Millions of Products:</strong> From electronics to daily groceries.</li>
                    <li><strong>24/7 Support:</strong> Our dedicated customer success team is always here format.</li>
                </ul>
            </>
        )
    },
    careers: { 
        title: "Careers", 
        content: (
            <>
                <p><strong>Join our team and build the future of shopping!</strong></p>
                <p>At OmniShop, we are constantly innovating. We're looking for passionate engineers, thoughtful designers, and brilliant business minds to join our mission.</p>
                <h3>Open Roles</h3>
                <ul>
                    <li>Senior Frontend Engineer (React/Tailwind)</li>
                    <li>Backend Systems Architect (Node.js/Firebase)</li>
                    <li>Logistics & Supply Chain Manager</li>
                    <li>Customer Success Representative</li>
                </ul>
                <p>Send your resume to careers@omnishop.in to apply.</p>
            </>
        ) 
    },
    press: { 
        title: "Press & Media", 
        content: (
            <>
                <p>Welcome to the OmniShop Press Room. Here you will find the latest news, press releases, and media resources.</p>
                <h3>Latest Announcements</h3>
                <p><strong>May 2026:</strong> OmniShop announces ultra-fast 10-minute delivery in select metropolitan areas, bringing daily essentials faster than ever.</p>
                <p><strong>January 2026:</strong> OmniShop crosses 10 million active users. A huge milestone for our incredible seller community.</p>
            </>
        ) 
    },
    blog: { 
        title: "OmniShop Blog", 
        content: (
            <>
                <h3>Top 5 Tech Gadgets to Buy in 2026</h3>
                <p>Discover the cutting edge tech that is changing the way we live and work...</p>
                <h3>A Guide to Sustainable Shopping</h3>
                <p>How OmniShop is reducing its carbon footprint, one package at a time.</p>
                <p><em>More posts coming soon!</em></p>
            </>
        ) 
    },
    returns: { 
        title: "Returns & Replacements", 
        content: (
            <>
                <p>We want you to be completely satisfied with your purchase. If you aren't, our Return Policy has got you covered.</p>
                <h3>Standard 10-Day Return Window</h3>
                <p>Most items can be returned within 10 days of delivery. The items must be unused, in their original packaging, and with all tags intact.</p>
                <h3>How to initiate a return:</h3>
                <ol>
                    <li>Go to your Account and navigate to "Track Orders"</li>
                    <li>Select the order and click "Request Return"</li>
                    <li>Our delivery partner will pick up the item within 48 hours</li>
                </ol>
            </>
        ) 
    },
    contact: { 
        title: "Contact Us", 
        content: (
            <>
                <p>Have an issue? We're here to help.</p>
                <h3>Customer Support</h3>
                <p>Email: <strong>support@omnishop.in</strong></p>
                <p>Phone: <strong>1-800-OMNISHOP</strong> (Toll-Free, 8 AM - 8 PM IST)</p>
                <h3>Corporate Headquarters</h3>
                <p>OmniShop Towers, Cyber City,<br/>Gurugram, Haryana - 122002<br/>India</p>
            </>
        ) 
    },
    privacy: { 
        title: "Privacy Policy", 
        content: (
            <>
                <p>Your privacy is of paramount importance to us. This policy outlines how OmniShop collects, uses, and protects your information.</p>
                <h3>Information We Collect</h3>
                <p>We collect essential information required to fulfill orders, including name, shipping address, contact details, and payment information.</p>
                <h3>Data Protection</h3>
                <p>Your data is encrypted safely in our databases. We never sell your personal information to third-party advertising companies. Your trust is our biggest asset.</p>
            </>
        ) 
    },
    terms: { 
        title: "Terms of Use", 
        content: (
            <>
                <p>Welcome to OmniShop. By using our website, you agree to these Terms of Use.</p>
                <h3>Account Limitations</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials. Minors must use the platform under the supervision of an adult.</p>
                <h3>Seller Responsibilities</h3>
                <p>Third-party sellers on our platform represent and warrant that they possess valid legal rights to sell their merchandise. Counterfeit products are strictly prohibited.</p>
            </>
        ) 
    },
    refunds: { 
        title: "Refund Policy", 
        content: (
            <>
                <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund.</p>
                <h3>Refund Processing</h3>
                <p>If approved, your refund will be processed and a credit will automatically be applied to your credit card or original method of payment within 5-7 business days.</p>
                <h3>Late or Missing Refunds</h3>
                <p>If you havenâ€™t received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted.</p>
            </>
        ) 
    }
};

export default function StaticPage() {
    const { pageId } = useParams();
    const pageData = PAGES[pageId] || { title: "Page Not Found", content: "The page you are looking for does not exist." };
    const meta = routeMeta[`/p/${pageId}`] || {
        title: `${pageData.title} | OmniShop`,
        description: `Learn more about ${pageData.title} on OmniShop.`,
    };

    return (
        <div className="min-h-screen bg-background">
            <PageSeo
                title={meta.title}
                description={meta.description}
                canonicalPath={`/p/${pageId}`}
                noIndex={!routeMeta[`/p/${pageId}`]}
            />
            <Navbar />
            <div className="pt-8 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-3xl font-bold mb-6">{pageData.title}</h1>
                    <div className="bg-card rounded-lg shadow-sm border border-border p-6 sm:p-8 prose prose-orange max-w-none text-gray-800">
                        {pageData.content}
                    </div>
                </div>
            </div>
        </div>
    );
}
