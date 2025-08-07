import mailjet from 'node-mailjet';

const sendEmail = async ({ to, subject, text, html }) => {
    const client = mailjet.connect(process.env.MAILJET_API_KEY, process.env.MAILJET_API_SECRET);

    const request = client.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: { Email: 'sumitkesar6307@gmail.com', Name: 'Fiesta Finder' },
                To: [{ Email: to }],
                Subject: subject,
                TextPart: text,
                HTMLPart: html,
            },
        ],
    });

    try {
        const result = await request;
        console.log('Email sent successfully:', result);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};

export default sendEmail;