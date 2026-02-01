import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST isteği kabul edilir' });
  }

  const { action, phone, code } = req.body;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;

  if (!accountSid || !authToken || !verifySid) {
    return res.status(500).json({ error: 'Twilio ortam değişkenleri eksik' });
  }

  const client = twilio(accountSid, authToken);

  try {
    if (action === 'send') {
      const verification = await client.verify.v2.services(verifySid)
        .verifications
        .create({ to: phone, channel: 'sms' });
      return res.status(200).json({ success: true, message: 'Doğrulama kodu SMS ile gönderildi!' });
    }

    if (action === 'verify') {
      const check = await client.verify.v2.services(verifySid)
        .verificationChecks
        .create({ to: phone, code });
      if (check.status === 'approved') {
        return res.status(200).json({ success: true, message: 'Doğrulama başarılı! Çipler transfer edildi (şaka tabii 😄)' });
      } else {
        return res.status(400).json({ success: false, message: 'Kod yanlış veya süresi dolmuş.' });
      }
    }

    return res.status(400).json({ error: 'Geçersiz işlem (action: send veya verify olmalı)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Sunucu hatası' });
  }
}
