const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // 1. Gestione CORS (permetti al frontend di chiamare il backend)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // In produzione metti il tuo dominio GitHub
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Rispondi subito alle richieste pre-flight del browser
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Accetta solo POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Vercel fa il parsing del body automaticamente!
    const { items } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    // Usa l'header "origin" o un fallback se non c'è (es. test locale)
    const origin = req.headers.origin || 'https://glaselva.github.io/pizzeria-website';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/success.html`,
      cancel_url: `${origin}/menu.html`,
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Errore Vercel:", error);
    res.status(500).json({ error: error.message });
  }
}
