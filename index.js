const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const Stripe = require('stripe');
const bodyParser = require('body-parser');

const app = express();
 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
/* -------------------------------
   ✅ STEP 1 — RAW WEBHOOK ROUTE FIRST
-------------------------------- */
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try { 
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
      console.log("✅ Webhook verified:", event.type);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Jab payment complete ho
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const planId = session.metadata?.planId;

      console.log("📦 Plan ID mila:", planId);

      if (!planId) {
        console.log("⚠️ planId missing hai!");
        return res.status(400).send("Missing planId");
      }

      // 👇 Ye hai asli update line
      const updated = await Subscription.findOneAndUpdate(
        { planId },
        {
          status: "completed",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        { new: true }
      );

      if (updated) {
        console.log(`✅ ${planId} status completed kar diya.`);
      } else {
        console.log(`❌ ${planId} DB me mila hi nahi.`);
      }
    }

    res.sendStatus(200);
  }
); 
app.use(express.json()); 
mongoose.connect('mongodb://mongo:27017/nhellow_db')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err)); 
const subscriptionSchema = new mongoose.Schema({
  planId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  durationDays: { type: Number, required: true },
  price: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  autoRenew: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' }
});

subscriptionSchema.pre('save', function (next) {
  const end = new Date(this.startDate);
  end.setDate(end.getDate() + this.durationDays);
  this.endDate = end;
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema); 
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await Subscription.findOne({ planId });
    if (!plan) return res.status(404).json({ error: 'Subscription not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: plan.name },
            unit_amount: plan.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/cancel`,
      metadata: { planId: plan.planId },
    });

    console.log("session======================>>>>>", session.id);

    plan.status = 'pending';
    await plan.save();

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 
const server = http.createServer(app);
server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
