import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface PaymentData {
  amount: number; // in cents
  currency: string;
  spotId: string;
  spotNumber: string;
  duration: number;
  userId: string;
}

export class StripeService {
  static async createPaymentIntent(paymentData: PaymentData) {
    // In a real app, this would call your backend API
    // For demo purposes, we'll simulate the payment
    
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentData.amount * 100, // Convert to cents
        currency: 'tnd',
        metadata: {
          spotId: paymentData.spotId,
          spotNumber: paymentData.spotNumber,
          duration: paymentData.duration,
          userId: paymentData.userId,
        },
      }),
    });

    return response.json();
  }

  static async processPayment(paymentData: PaymentData) {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      // For demo - simulate successful payment
      // In real app, you'd use Stripe Elements or Payment Sheet
      
      return {
        success: true,
        paymentIntent: {
          id: `pi_test_${Date.now()}`,
          status: 'succeeded',
          amount: paymentData.amount * 100,
          currency: 'tnd',
        },
      };
    } catch (error) {
      console.error('Payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  static getTestCards() {
    return {
      success: '4242424242424242',
      declined: '4000000000000002',
      requiresAuth: '4000002500003155',
      insufficientFunds: '4000000000009995',
    };
  }
}