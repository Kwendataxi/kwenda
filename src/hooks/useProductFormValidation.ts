import { useState, useEffect } from 'react';

interface ValidationErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  images?: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  images: File[];
}

export const useProductFormValidation = (formData: FormData) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    const requiredFields = ['title', 'description', 'price', 'category', 'images'];
    const completed = requiredFields.filter(field => {
      if (field === 'images') return formData.images.length > 0;
      return formData[field as keyof FormData]?.toString().trim();
    });
    
    setCompletionRate(Math.round((completed.length / requiredFields.length) * 100));

    // Validation en temps réel
    const newErrors: ValidationErrors = {};
    
    if (formData.title && formData.title.length > 100) {
      newErrors.title = "Max 100 caractères";
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Max 500 caractères";
    }
    
    if (formData.price && Number(formData.price) < 0) {
      newErrors.price = "Prix invalide";
    }
    
    if (formData.images.length > 5) {
      newErrors.images = "Maximum 5 images";
    }
    
    setErrors(newErrors);
  }, [formData]);

  const isValid = Object.keys(errors).length === 0 && completionRate === 100;

  return { errors, completionRate, isValid };
};
