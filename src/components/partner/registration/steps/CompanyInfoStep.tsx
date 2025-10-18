import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyInfoSchema, CompanyInfoFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyInfoStepProps {
  data: CompanyInfoFormData;
  onNext: (data: CompanyInfoFormData) => void;
}

export const CompanyInfoStep = ({ data, onNext }: CompanyInfoStepProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyInfoFormData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: data,
  });

  const business_type = watch('business_type');

  const onSubmit = (formData: CompanyInfoFormData) => {
    console.log('✅ Step 1 validated:', formData);
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nom de l'entreprise */}
      <div className="space-y-2">
        <Label htmlFor="company_name" className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-green-600" />
          Nom de l'entreprise *
        </Label>
        <Input
          id="company_name"
          {...register('company_name')}
          placeholder="Ex: Transport Express SA"
          className={errors.company_name ? 'border-red-500' : ''}
        />
        {errors.company_name && (
          <p className="text-sm text-red-500">{errors.company_name.message}</p>
        )}
      </div>

      {/* Type d'entreprise */}
      <div className="space-y-2">
        <Label htmlFor="business_type">Type d'entreprise *</Label>
        <Select
          value={business_type}
          onValueChange={(value) => setValue('business_type', value as any)}
        >
          <SelectTrigger className={errors.business_type ? 'border-red-500' : ''}>
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Entreprise individuelle</SelectItem>
            <SelectItem value="company">Société (SARL, SA, etc.)</SelectItem>
            <SelectItem value="cooperative">Coopérative</SelectItem>
            <SelectItem value="association">Association</SelectItem>
          </SelectContent>
        </Select>
        {errors.business_type && (
          <p className="text-sm text-red-500">{errors.business_type.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="contact_email" className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-green-600" />
          Email professionnel *
        </Label>
        <Input
          id="contact_email"
          type="email"
          {...register('contact_email')}
          placeholder="contact@entreprise.com"
          className={errors.contact_email ? 'border-red-500' : ''}
        />
        {errors.contact_email && (
          <p className="text-sm text-red-500">{errors.contact_email.message}</p>
        )}
      </div>

      {/* Téléphone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-600" />
          Téléphone *
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+243 999 000 000"
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
        <p className="text-xs text-gray-500">Format international requis (+243...)</p>
      </div>

      {/* Adresse */}
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600" />
          Adresse (optionnel)
        </Label>
        <Textarea
          id="address"
          {...register('address')}
          placeholder="Ex: Avenue de la Paix, Kinshasa/Gombe"
          rows={3}
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      {/* Bouton suivant */}
      <div className="flex justify-end pt-4">
        <Button 
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};
