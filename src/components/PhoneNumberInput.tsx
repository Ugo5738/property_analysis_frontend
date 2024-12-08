import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../components/contexts/AuthContext";

const PhoneNumberInput: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loginWithPhone } = useAuth();

  const validatePhoneNumber = (number: string): boolean => {
    const phoneNumberObject = parsePhoneNumberFromString(number);
    return phoneNumberObject ? phoneNumberObject.isValid() : false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePhoneNumber(phoneNumber)) {
      try {
        const formattedPhoneNumber = phoneNumber.replace('+', '');
        console.log(formattedPhoneNumber)
        await loginWithPhone(formattedPhoneNumber);
        navigate('/properties');
      } catch(error) {
        console.error('Authentication failed:', error);
        setError('Authentication failed. Please try again.');
      };
    } else {
      setError('Please enter a valid international phone number, e.g., +123456789.');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Enter Your Phone Number</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Input
            type="tel"
            placeholder="+123456789"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full"
          />
        </div>
        {error && (
          <div className="text-red-600 mb-4">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          Continue
        </Button>
      </form>
    </div>
  );
};

export default PhoneNumberInput;
