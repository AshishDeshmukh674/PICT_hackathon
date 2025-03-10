"use client";
import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { MedicineDeliveryService } from '../../services/medicineDelivery';

function MedicineList({ medicines, processing, setProcessing, cartUrl, setCartUrl }) {
  const handlePharmeasyCheckout = async () => {
    setProcessing(true);
    try {
      const result = await MedicineDeliveryService.processPrescriptionOnPharmeasy(
        medicines.map(med => ({
          name: med.name,
          strength: med.strength,
          quantity: med.quantity || 1,
          totalPrice: med.price
        }))
      );
      
      if (result.status === 'completed') {
        setCartUrl(result.cartUrl);
        if (result.errors?.length > 0) {
          result.errors.forEach(error => toast.warning(error));
        } else {
          toast.success('All medicines added to cart successfully!');
        }
      } else {
        toast.error('Failed to add medicines to cart');
      }
      
    } catch (error) {
      console.error('Failed to process order:', error);
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Prescribed Medicines</h2>
        {!cartUrl && (
          <Button 
            onClick={handlePharmeasyCheckout}
            disabled={processing || medicines.length === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Order via PharmEasy
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((medicine) => (
          <Card key={medicine.name} className="p-4">
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-lg capitalize">{medicine.name}</h3>
              <p className="text-sm text-gray-500">Generic: {medicine.genericName}</p>
              <p className="text-sm text-gray-500">Strength: {medicine.strength}</p>
              <p className="text-sm text-gray-500">Dosage: {medicine.dosage}</p>
              <p className="text-sm text-gray-500">
                Prescribed Quantity: {medicine.quantity}
              </p>
              <p className="text-lg font-bold">₹{medicine.price}</p>
            </div>
          </Card>
        ))}
      </div>

      {processing && (
        <div className="space-y-2">
          <Progress value={processing ? 50 : 0} className="w-full" />
          <p className="text-sm text-center text-gray-500">
            Adding medicines to PharmEasy cart...
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
  );
}

export default MedicineList; 