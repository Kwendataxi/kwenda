import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section id="accueil">
          <Hero />
        </section>
        <section id="avantages">
          <Features />
        </section>
        <section id="services">
          <Services />
        </section>
      </main>
      <section id="contact">
        <Footer />
      </section>
    </div>
  );
};

export default Index;
