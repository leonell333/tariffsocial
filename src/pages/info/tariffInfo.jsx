import { useLocation } from 'react-router-dom';

const contentMap = {
  '/info/about': {
    title: 'About Tariff Social',
    body: (
      <>
        Tariff Social is a social media platform developed by Australian data journalist Dan Petrie — a self-described writer, spreadsheet enthusiast, and unlikely tech founder.
        <br /><br />
        What began as an offhand remark quickly became a week-long development sprint, resulting in a platform built to champion the benefits of free and fair trade.
        <br /><br />
        Developed independently and at speed, Tariff Social reflects the belief that good ideas — like the free and fair exchange of goods — should be accessible, unfiltered, and unburdened by unnecessary barriers.
        <br /><br />
        <strong>Foundational Principles:</strong><br />
        - No unsolicited financial advice<br />
        - No adult material<br />
        - No dark web content
        <br /><br />
        <strong>Purpose and Intent:</strong><br />
        - Promote free trade and international cooperation<br />
        - Foster civil discourse (with space for the occasional meme)<br />
        - Enforce zero tolerance for bigotry, spam, and economic imperialism<br />
        - Provide a space for users to post, message, react, and connect — with tea in hand<br />
        - Celebrate exporters and innovators creating world-class products and services<br />
        - Offer transparent, fair pricing for advertising in AUD, GBP, EUR, JPY — and of course, USD<br />
        - Prohibit cryptocurrency promotions to maintain signal over noise
        <br /><br />
        <strong>Why the name?</strong><br />
        While the name <strong>Tariff Social</strong> is a nod to media reporting around the implementation of tariffs in the United States, the platform welcomes all views around export and import stories.
        <br /><br />
        Discussions in particular around issues including intellectual property are welcome.
      </>
    )
  },
  '/info/privacy': {
    title: 'Privacy Policy',
    body: (
      <>
        Tariff Social is owned by Newsroom Grind Pty Ltd. The site is based in Australia and trademarked locally and internationally.
        <br /><br />
        This Privacy Policy outlines how Tariff Social collects, uses, and protects your data in accordance with Australian privacy laws and relevant international data protections.
        <br /><br />
        We collect only the data necessary to provide our service, including account information, cookies for analytics, and optional metadata in posts. We do not sell or share your data with third parties.
        <br /><br />
        Users may request data deletion by contacting privacy@tariffsocial.com.
        <br /><br />
        This platform does not tolerate or knowingly host adult content, dark web links, or financial advice. Please report any breach of this policy.
      </>
    )
  },
  '/info/terms': {
    title: 'Terms and Conditions',
    body: (
      <>
        Tariff Social is owned by Newsroom Grind Pty Ltd. The site is based in Australia and trademarked locally and internationally.
        <br /><br />
        By using Tariff Social, you agree to abide by our community standards and Australian digital communications law.
        <br /><br />
        All content posted is the responsibility of the user. Tariff Social reserves the right to remove any material that breaches our Code of Conduct.
        <br /><br />
        Use of this platform for spam, harassment, unauthorised advertising, or coordinated misinformation will result in suspension or removal.
        <br /><br />
        We provide no financial advice, and posts should not be interpreted as such. We do not permit adult content or referral links to such content.
      </>
    )
  },
  '/info/copyright': {
    title: 'Copyright Statement',
    body: (
      <>
        Tariff Social is owned by Newsroom Grind Pty Ltd. The site is based in Australia and trademarked locally and internationally.
        <br /><br />
        By using Tariff Social, you agree to abide by our community standards and Australian digital communications law.
        <br /><br />
        All content posted is the responsibility of the user. Tariff Social reserves the right to remove any material that breaches our Code of Conduct.
        <br /><br />
        Use of this platform for spam, harassment, unauthorised advertising, or coordinated misinformation will result in suspension or removal.
        <br /><br />
        We provide no financial advice, and posts should not be interpreted as such. We do not permit adult content or referral links to such content.
      </>
    )
  },
  '/info/conduct': {
    title: 'Code of Conduct',
    body: (
      <>
        Tariff Social is a community-first platform built on mutual respect and fair dialogue.
        <br /><br />
        All users must:
        <br />
        - Refrain from hate speech, harassment, or personal attacks<br />
        - Avoid spam and self-promotion without context<br />
        - Respect other viewpoints even when disagreeing<br />
        - Avoid illegal content and conduct<br />
        - Follow moderators' instructions<br /><br />
        Violations may result in warnings, content removal, or account suspension depending on severity. Let's build a fair, inclusive community together.
      </>
    )
  }
};

const TariffInfo = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const content = contentMap[currentPath];

  return (
    <div className="w-full min-h-[calc(100vh-108px)] bg-white rounded-xl p-6 text-black space-y-6 overflow-y-auto" style={{ fontFamily: 'poppins' }}>
      {content ? (
        <section className='px-[1%] mt-[35px]'>
          <h2 className="text-xl font-bold text-[#2c3e50] mb-2">{content.title}</h2>
          <p className="text-[18px] leading-relaxed">{content.body}</p>
        </section>
      ) : (
        <p className="text-center text-gray-600">Content not found.</p>
      )}
    </div>
  );
};

export default TariffInfo;
