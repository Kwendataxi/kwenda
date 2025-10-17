import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSwipeable } from 'react-swipeable';

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar?: string;
  service: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marie Kabila',
    location: 'Ngaliema',
    rating: 5,
    comment: 'J\'ai économisé plus de 50,000 CDF ce mois grâce à Kwenda. Service rapide et fiable !',
    service: 'VTC'
  },
  {
    name: 'Jean Mutombo',
    location: 'Gombe',
    rating: 5,
    comment: 'En tant que chauffeur, je gagne maintenant 180,000 CDF par mois. Merci Kwenda !',
    service: 'Chauffeur'
  },
  {
    name: 'Grace Tshala',
    location: 'Lemba',
    rating: 5,
    comment: 'Livraison ultra rapide et prix abordables. Je recommande à 100% !',
    service: 'Livraison'
  },
  {
    name: 'Patrick Nkulu',
    location: 'Bandalungwa',
    rating: 5,
    comment: 'Marketplace avec de vrais produits congolais. C\'est ce qu\'on attendait !',
    service: 'Marketplace'
  }
];

export const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const previousTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextTestimonial,
    onSwipedRight: previousTestimonial,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <section className="py-16 bg-muted/30 relative overflow-hidden">
      {/* Progressive blur background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-background/0 via-primary/5 to-background/0"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ils ont déjà profité de l'offre
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Plus de 12,000+ utilisateurs satisfaits à travers la RDC
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto" {...swipeHandlers}>
          <div className="relative h-[400px] perspective-1000"
            style={{ perspective: '1000px' }}
          >
            {/* 3D Card Stack Effect */}
            {TESTIMONIALS.map((testimonial, idx) => {
              const offset = idx - currentIndex;
              const isActive = idx === currentIndex;
              const isVisible = Math.abs(offset) <= 1;
              
              return isVisible ? (
                <motion.div
                  key={idx}
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    scale: isActive ? 1 : 0.9 - Math.abs(offset) * 0.05,
                    y: Math.abs(offset) * 30,
                    opacity: Math.abs(offset) > 1 ? 0 : 1 - Math.abs(offset) * 0.4,
                    zIndex: 10 - Math.abs(offset),
                    rotateY: offset * -8,
                    filter: `blur(${Math.abs(offset) * 3}px)`,
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                  drag={isActive ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (offset.x > 100) previousTestimonial();
                    if (offset.x < -100) nextTestimonial();
                  }}
                >
                  <Card className="h-full bg-card/95 backdrop-blur-xl border-2 border-border/50 shadow-2xl">
                    <div className="h-full p-8 md:p-12 flex flex-col items-center justify-center text-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="relative mb-4"
                      >
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl" />
                        <Avatar className="h-20 w-20 relative z-10 ring-4 ring-primary/20">
                          <AvatarImage src={testimonial.avatar} />
                          <AvatarFallback className="text-2xl bg-primary/10">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>

                      <motion.div 
                        className="flex mb-4"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                          >
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          </motion.div>
                        ))}
                      </motion.div>

                      <p className="text-xl md:text-2xl mb-6 italic text-foreground font-medium">
                        "{testimonial.comment}"
                      </p>

                      <div>
                        <p className="font-bold text-lg">{testimonial.name}</p>
                        <p className="text-muted-foreground">{testimonial.location}</p>
                        <p className="text-sm text-primary mt-1 font-semibold">{testimonial.service}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : null;
            })}

            {/* Navigation buttons with 3D effect */}
            <motion.div
              whileHover={{ scale: 1.1, x: -8 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={previousTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 rounded-full bg-background/90 backdrop-blur-md hover:bg-primary hover:text-primary-foreground shadow-xl border-2"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.1, x: 8 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 rounded-full bg-background/90 backdrop-blur-md hover:bg-primary hover:text-primary-foreground shadow-xl border-2"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </motion.div>
          </div>

          {/* Dots indicator enhanced */}
          <div className="flex justify-center gap-3 mt-8">
            {TESTIMONIALS.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-3 rounded-full overflow-hidden ${
                  index === currentIndex ? 'w-12' : 'w-3'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className="absolute inset-0 bg-muted-foreground/30" />
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-0 bg-primary"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
