import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import TravelForm from "@/components/TravelForm";
import Events from "@/components/Events";
import About from "@/components/About";
import Cadastur from "@/components/Cadastur";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Gallery />
      <TravelForm />
      <Events />
      <About />
      <Cadastur />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
