export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
  }

  const {
    profil, profilAutre, couvoirNom, couvoirProd,
    nom, prenom, adresse, entreprise, telephone, email,
    typeDemande, demandeAutre, message,
  } = req.body || {};

  if (!profil || !typeDemande || !nom || !prenom || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Merci de compléter tous les champs obligatoires.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Adresse email invalide.' });
  }

  const lines = [];
  lines.push(`Profil : ${profil}${profil === 'Autre' ? ' (' + (profilAutre || '') + ')' : ''}`);
  if (profil === 'Manager de couvoir') {
    lines.push(`Nom du couvoir : ${couvoirNom || ''}`);
    lines.push(`Production annuelle de poussins : ${couvoirProd || ''}`);
  }
  lines.push('');
  lines.push(`Nom : ${nom}`);
  lines.push(`Prénom : ${prenom}`);
  lines.push(`Adresse : ${adresse || ''}`);
  lines.push(`Entreprise : ${entreprise || ''}`);
  lines.push(`Téléphone : ${telephone || ''}`);
  lines.push(`Email : ${email}`);
  lines.push('');
  lines.push(`Type de demande : ${typeDemande}${typeDemande === 'Autre' ? ' (' + (demandeAutre || '') + ')' : ''}`);
  lines.push('');
  lines.push('Message :');
  lines.push(message);

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Site Perfatch <contact@perfatch.fr>',
        to: ['contact@perfatch.fr'],
        reply_to: email,
        subject: `Contact site Perfatch — ${typeDemande} — ${nom} ${prenom}`,
        text: lines.join('\n'),
      }),
    });

    if (!r.ok) {
      console.error('Resend error', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'Envoi impossible pour le moment, réessaie plus tard.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error', err);
    return res.status(500).json({ ok: false, error: 'Erreur serveur, réessaie plus tard.' });
  }
}
