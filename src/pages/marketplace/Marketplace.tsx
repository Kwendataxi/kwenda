import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Filter, Star, Heart, ShoppingCart, MapPin, 
  Truck, Clock, Shield, TrendingUp, Eye, ArrowRight,
  Package, Store, Tag, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import ModernFooter from "@/components/landing/ModernFooter";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "Tous", icon: <Package className="w-4 h-4" />, count: "500+" },
    { id: "electronics", name: "Électronique", icon: <Zap className="w-4 h-4" />, count: "120+" },
    { id: "fashion", name: "Mode", icon: <Tag className="w-4 h-4" />, count: "80+" },
    { id: "food", name: "Alimentation", icon: <Store className="w-4 h-4" />, count: "150+" },
    { id: "home", name: "Maison", icon: <Package className="w-4 h-4" />, count: "90+" },
    { id: "beauty", name: "Beauté", icon: <Heart className="w-4 h-4" />, count: "60+" }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Samsung Galaxy A54",
      price: 450000,
      originalPrice: 550000,
      image: "/placeholder.svg",
      rating: 4.8,
      reviews: 45,
      seller: "TechStore Kinshasa",
      location: "Gombe, Kinshasa",
      discount: 18,
      isPopular: true,
      deliveryTime: "2-4h"
    },
    {
      id: 2,
      name: "Robe Africaine Premium",
      price: 85000,
      image: "/placeholder.svg",
      rating: 4.9,
      reviews: 32,
      seller: "Mode Africaine",
      location: "Lubumbashi",
      isNew: true,
      deliveryTime: "1-2 jours"
    },
    {
      id: 3,
      name: "Riz Jasmin 25kg",
      price: 45000,
      originalPrice: 50000,
      image: "/placeholder.svg",
      rating: 4.7,
      reviews: 128,
      seller: "Alimentation Kwenda",
      location: "Kinshasa",
      discount: 10,
      deliveryTime: "30min-1h"
    },
    {
      id: 4,
      name: "MacBook Air M2",
      price: 1200000,
      image: "/placeholder.svg",
      rating: 5.0,
      reviews: 15,
      seller: "Premium Tech",
      location: "Gombe, Kinshasa",
      isPremium: true,
      deliveryTime: "2-4h"
    },
    {
      id: 5,
      name: "Chaussures Nike Air Max",
      price: 120000,
      originalPrice: 150000,
      image: "/placeholder.svg",
      rating: 4.6,
      reviews: 67,
      seller: "Sports Shop",
      location: "Kolwezi",
      discount: 20,
      deliveryTime: "1-2 jours"
    },
    {
      id: 6,
      name: "Set Maquillage Professionnel",
      price: 75000,
      image: "/placeholder.svg",
      rating: 4.8,
      reviews: 89,
      seller: "Beauty Palace",
      location: "Lubumbashi",
      isPopular: true,
      deliveryTime: "2-4h"
    }
  ];

  const topSellers = [
    { name: "TechStore Kinshasa", rating: 4.9, sales: 1200, verified: true },
    { name: "Mode Africaine", rating: 4.8, sales: 850, verified: true },
    { name: "Alimentation Kwenda", rating: 4.7, sales: 2100, verified: true },
    { name: "Premium Tech", rating: 5.0, sales: 340, verified: true }
  ];

  const cities = ["Kinshasa", "Lubumbashi", "Kolwezi"];

  const filteredProducts = featuredProducts.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.seller.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
          <div className="container mx-auto max-w-7xl text-center relative z-10">
            <Badge variant="outline" className="border-white/30 text-white mb-6">
              🛍️ Kwenda Marketplace
            </Badge>
            <h1 className="text-display-lg mb-6">
              Marketplace
              <br />
              <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                Congo RDC
              </span>
            </h1>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
              Découvrez les meilleurs produits du Congo avec livraison rapide dans les 3 grandes villes. 
              Achetez local, supportez l'économie congolaise !
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Rechercher des produits, marques, vendeurs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-white/95 backdrop-blur-sm border-white/20"
                />
                <Button size="lg" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Parcourir les Produits
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Store className="w-5 h-5 mr-2" />
                Devenir Vendeur
              </Button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 px-4 border-b">
          <div className="container mx-auto max-w-7xl">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon}
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-display-md bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                Produits Populaires
              </h2>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
                <select className="px-4 py-2 border rounded-lg bg-background">
                  <option>Trier par: Popularité</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                  <option>Mieux notés</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  <div className="relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isPopular && (
                        <Badge className="bg-red-500 text-white">🔥 Populaire</Badge>
                      )}
                      {product.isNew && (
                        <Badge className="bg-green-500 text-white">✨ Nouveau</Badge>
                      )}
                      {product.isPremium && (
                        <Badge className="bg-purple-500 text-white">👑 Premium</Badge>
                      )}
                      {product.discount && (
                        <Badge className="bg-orange-500 text-white">-{product.discount}%</Badge>
                      )}
                    </div>

                    {/* Favorite */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.reviews} avis)
                      </span>
                    </div>

                    <h3 className="text-heading-sm mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-heading-lg text-primary font-bold">
                        {product.price.toLocaleString()} CDF
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice.toLocaleString()} CDF
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Store className="w-4 h-4" />
                        {product.seller}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {product.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck className="w-4 h-4" />
                        Livraison: {product.deliveryTime}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 group-hover:scale-105 transition-transform">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" className="group">
                Voir Plus de Produits
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* Top Sellers */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-display-md text-center mb-16 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
              Vendeurs de Confiance
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {topSellers.map((seller, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                      {seller.name.charAt(0)}
                    </div>
                    
                    <h3 className="text-heading-sm mb-2 flex items-center justify-center gap-2">
                      {seller.name}
                      {seller.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{seller.rating}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {seller.sales.toLocaleString()} ventes
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cities */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-display-md mb-4">Livraison dans 3 Villes</h2>
              <p className="text-body-lg text-muted-foreground">
                Commandez depuis n'importe où, nous livrons dans les principales villes du Congo
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {cities.map((city, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-8">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-heading-lg mb-4">{city}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        Livraison rapide
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Paiement sécurisé
                      </div>
                    </div>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                      Explorer {city}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-display-md mb-6">Vendez vos Produits sur Kwenda Marketplace</h2>
            <p className="text-xl mb-8 text-white/90">
              Rejoignez plus de 200 vendeurs qui font confiance à Kwenda pour développer leur business. 
              Commission de seulement 8% avec livraison intégrée !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/partners/vendre-en-ligne">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Store className="w-5 h-5 mr-2" />
                  Devenir Vendeur
                </Button>
              </Link>
              <Link to="/support/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  En Savoir Plus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <ModernFooter />
      </div>
    </PageTransition>
  );
};

export default Marketplace;