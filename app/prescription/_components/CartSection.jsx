"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Trash2, CreditCard, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { MedicineDeliveryService } from '../../services/medicineDelivery';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Progress } from "../../../components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";

function CartSection({ items, setItems }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cartUrl, setCartUrl] = useState(null);
  const [deliveryOptions, setDeliveryOptions] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    if (items.length > 0) {
      searchDeliveryOptions();
    }
  }, [items]);

  const searchDeliveryOptions = async () => {
    try {
      const results = await MedicineDeliveryService.searchMedicineAvailability(items);
      setDeliveryOptions(results);
    } catch (error) {
      toast.error('Failed to fetch delivery options');
    }
  };

  const handlePlatformSelect = (platform, url) => {
    setSelectedPlatform(platform);
    // Redirect to the platform's checkout
    window.open(url, '_blank');
  };

  const removeFromCart = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    toast.success('Item removed from cart');
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + parseFloat(item.totalPrice), 0).toFixed(2);
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Here you would integrate with your payment gateway
      // For now, we'll just simulate a payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Order placed successfully!');
      setItems([]); // Clear cart after successful order
    } catch (error) {
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePharmeasyCheckout = async () => {
    setProcessing(true);
    try {
      const result = await MedicineDeliveryService.processPrescriptionOnPharmeasy(items);
      
      // Update progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // When complete, set the cart URL
      setCartUrl(result.cartUrl);
      
      if (result.errors.length > 0) {
        toast.warning('Some medicines may not be available on PharmEasy');
      }

      // Clear interval when done
      clearInterval(progressInterval);
      
    } catch (error) {
      toast.error('Failed to process order on PharmEasy');
    } finally {
      setProcessing(false);
    }
  };

  const handleRedirect = () => {
    if (cartUrl) {
      window.open(cartUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shopping Cart</h2>

      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold capitalize">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm font-medium">₹{item.totalPrice}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeFromCart(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Delivery Options */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Delivery Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryOptions?.zepto?.available && (
                <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handlePlatformSelect('zepto', deliveryOptions.zepto.checkoutUrl)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Zepto</h4>
                      <p className="text-sm text-gray-500">Delivery in 19-30 min</p>
                      <p className="text-sm font-medium">₹{deliveryOptions.zepto.totalPrice}</p>
                    </div>
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                </Card>
              )}

              {deliveryOptions?.pharmeasy?.available && (
                <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handlePlatformSelect('pharmeasy', deliveryOptions.pharmeasy.checkoutUrl)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">PharmEasy</h4>
                      <p className="text-sm text-gray-500">Delivery in 24-48 hrs</p>
                      <p className="text-sm font-medium">₹{deliveryOptions.pharmeasy.totalPrice}</p>
                    </div>
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                </Card>
              )}

              {/* Add more delivery platforms as needed */}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              * Medicines will be delivered based on availability and local regulations
            </p>
            <p className="text-sm text-gray-600">
              * Prescription verification may be required at checkout
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-lg">₹{getTotalAmount()}</span>
            </div>
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={processing}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {processing ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>

          <div className="mt-6">
            <Button
              className="w-full mb-4"
              onClick={handlePharmeasyCheckout}
              disabled={processing || items.length === 0}
            >
              Order via PharmEasy
            </Button>

            {processing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-gray-500">
                  Processing your order on PharmEasy...
                </p>
              </div>
            )}

            {cartUrl && (
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Order Ready!</AlertTitle>
                  <AlertDescription>
                    Your medicines have been added to PharmEasy cart
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-4">
                  <Button className="flex-1" onClick={handleRedirect}>
                    Go to PharmEasy Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setCartUrl(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CartSection; 