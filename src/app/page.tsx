"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Home as HomeIcon, Heart, PlusSquare, LayoutGrid, User, Coffee, Utensils, ChefHat, Apple, Carrot, CupSoda, CakeSlice, Grid3X3, Bell, ChevronRight, Clock, Star, ScanLine, CalendarDays, ShoppingBag } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function Home() {
  const { t } = useTranslation();

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-cream flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-72px)] flex items-center justify-center pt-12 pb-24 lg:pt-0">
        {/* Background concentric circles */}
        <div className="absolute -bottom-[400px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-40 pointer-events-none z-0">
          <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full border-[60px] border-white shadow-xl shadow-stone-light/20"></div>
          <div className="absolute bottom-[-300px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full border-[80px] border-white shadow-xl shadow-stone-light/10"></div>
          <div className="absolute bottom-[-400px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full border-[100px] border-white shadow-xl shadow-stone-light/5"></div>
        </div>

        {/* Decorative Ingredients */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="absolute bottom-12 left-8 lg:left-[15%] animate-float-delayed pointer-events-none z-0">
          <div className="w-24 h-24 bg-white rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex items-center justify-center relative">
            <div className="w-20 h-20 bg-[#E8DCC4] rounded-full shadow-inner opacity-90"></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="absolute bottom-32 left-4 lg:left-[8%] animate-float pointer-events-none z-0">
          <div className="w-16 h-16 bg-white rounded-full shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] flex items-center justify-center relative">
            <div className="w-12 h-12 bg-gray-100 rounded-full shadow-inner opacity-90"></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="absolute bottom-40 left-[25%] lg:left-[22%] animate-float pointer-events-none z-0 transform rotate-12">
          <div className="w-6 h-6 bg-[#527931] rounded-[0px_12px_0px_12px] shadow-sm opacity-90"></div>
        </motion.div>

        <div className="page-container relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Typography & CTAs */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-2xl">
            {/* Top Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-8 border border-stone-light/30">
              <span className="text-terracotta">
                <ChefHat className="w-4 h-4" />
              </span>
              <p className="text-sm font-medium text-stone">
                <span className="text-terracotta font-semibold">{t('home.badge_highlight')}</span> {t('home.badge_text')}
              </p>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-heading text-neutral-800 leading-[1.1] mb-6 tracking-tight">
              {t('home.title')}
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg text-brown mb-10 max-w-lg leading-relaxed">
              {t('home.subtitle')}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 mb-12">
              <Link 
                href="/discover"
                className="px-8 py-3.5 bg-neutral-800 text-white rounded-full font-semibold hover:bg-neutral-700 transition-colors shadow-lg shadow-neutral-800/20"
              >
                Cuisiner
              </Link>
              <Link 
                href="/login"
                className="px-8 py-3.5 bg-white text-neutral-800 rounded-full font-semibold hover:bg-cream-dark transition-colors shadow-sm border border-stone-light/40"
              >
                Créer un compte
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: App Mockup & Floating Badges */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative h-[600px] lg:h-[700px] flex justify-center items-center perspective-1000">
            
            {/* Mockup Phone */}
            <div className="relative w-[300px] lg:w-[340px] h-[600px] lg:h-[680px] bg-[#F7F7F7] rounded-[48px] shadow-2xl border-[8px] border-white overflow-hidden z-10 lg:rotate-y-[-10deg] lg:rotate-x-[5deg] animate-float transform-gpu">
              
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white rounded-b-3xl z-20"></div>

              {/* App UI Inside Phone */}
              <div className="p-6 pt-12 h-full flex flex-col pointer-events-none select-none">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-light/30 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-600" />
                    </div>
                    <span className="font-medium text-sm text-neutral-800">{t('home.phone_user')}</span>
                  </div>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Bell className="w-4 h-4 text-stone" />
                  </div>
                </div>

                <h2 className="text-2xl font-heading text-neutral-800 mb-4">{t('home.phone_title')}</h2>
                
                <div className="bg-white px-4 py-3 rounded-xl flex items-center gap-2 mb-6 shadow-sm">
                  <Search className="w-4 h-4 text-stone-light" />
                  <span className="text-stone-light text-sm">{t('home.phone_search')}</span>
                </div>

                {/* Grid categories */}
                <div className="grid grid-cols-4 gap-y-4 gap-x-2 mb-8">
                  {[
                    { name: t('home.cat_breakfast'), icon: Coffee, color: 'text-amber-600' },
                    { name: t('home.cat_lunch'), icon: Utensils, color: 'text-orange-500' },
                    { name: t('home.cat_dinner'), icon: ChefHat, color: 'text-stone-600' },
                    { name: t('home.cat_snack'), icon: Apple, color: 'text-red-500' },
                    { name: t('home.cat_salad'), icon: Carrot, color: 'text-orange-400' },
                    { name: t('home.cat_drink'), icon: CupSoda, color: 'text-green-500' },
                    { name: t('home.cat_dessert'), icon: CakeSlice, color: 'text-pink-500' },
                    { name: t('home.cat_more'), icon: Grid3X3, color: 'text-white' }
                  ].map((cat, i) => {
                    const Icon = cat.icon;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${i === 7 ? 'bg-[#98D8D0]' : 'bg-white'}`}>
                          <Icon className={`w-5 h-5 ${cat.color}`} />
                        </div>
                        <span className="text-[10px] text-stone font-medium">{cat.name}</span>
                      </div>
                    );
                  })}
                </div>

                <h3 className="font-semibold text-neutral-800 mb-4">{t('home.trending')}</h3>
                <div className="flex gap-4">
                  <div className="w-40 h-48 bg-stone-light/20 rounded-2xl relative overflow-hidden flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" alt="Food" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs text-terracotta shadow-sm">♥</div>
                  </div>
                  <div className="w-40 h-48 bg-stone-light/20 rounded-2xl relative overflow-hidden flex-shrink-0">
                    <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80" alt="Food" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs text-terracotta shadow-sm">♥</div>
                  </div>
                </div>

                {/* Bottom Nav Mockup */}
                <div className="absolute bottom-6 left-6 right-6 h-14 bg-neutral-800 rounded-full flex items-center justify-around px-4 shadow-lg">
                  <div className="w-10 h-10 bg-[#D4F554] rounded-full flex items-center justify-center">
                    <HomeIcon className="w-5 h-5 text-charcoal" />
                  </div>
                  <Heart className="w-5 h-5 text-stone-light" />
                  <PlusSquare className="w-5 h-5 text-stone-light" />
                  <LayoutGrid className="w-5 h-5 text-stone-light" />
                  <User className="w-5 h-5 text-stone-light" />
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="absolute top-10 left-0 lg:-left-20 z-20 animate-float-delayed">
              <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-stone-light/10">
                <img src="https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=100&q=80" alt="Recipe" className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="font-medium text-sm text-neutral-800">Sausage egg</p>
                  <div className="flex items-center gap-1 text-xs text-stone mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>8 mins</span>
                    <Star className="w-3 h-3 text-yellow-500 ml-1 fill-yellow-500" />
                    <span>4.9</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="absolute top-40 left-4 lg:-left-16 z-20 animate-float">
              <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-stone-light/10">
                <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=80" alt="Recipe" className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="font-medium text-sm text-neutral-800">Mix vegetables</p>
                  <div className="flex items-center gap-1 text-xs text-stone mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>3 mins</span>
                    <Star className="w-3 h-3 text-yellow-500 ml-1 fill-yellow-500" />
                    <span>4.5</span>
                  </div>
                </div>
                <div className="ml-2 w-6 h-6 flex items-center justify-center text-stone">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }} className="absolute bottom-24 left-4 lg:-left-8 z-20 animate-float-delayed">
              <div className="bg-[#D4F554] p-4 rounded-3xl shadow-xl w-32 border border-[#bce038]">
                <div className="mb-2">
                  <Clock className="w-5 h-5 text-charcoal" />
                </div>
                <p className="text-xs text-charcoal/70 font-medium mb-1">Cooking time</p>
                <p className="text-2xl font-semibold text-charcoal">30 <span className="text-base font-normal">mins</span></p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }} className="absolute top-24 right-0 lg:-right-12 z-20 animate-float">
              <div className="bg-[#FBCBAE] p-4 rounded-3xl shadow-xl w-32 border border-[#f0b491]">
                <div className="mb-2">
                  <Utensils className="w-5 h-5 text-charcoal" />
                </div>
                <p className="text-xs text-charcoal/70 font-medium mb-1">Servings</p>
                <p className="text-2xl font-semibold text-charcoal">4 <span className="text-base font-normal">peoples</span></p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Feature Section 1 */}
      <section className="py-24 relative z-10">
        <div className="page-container grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1 relative rounded-[40px] overflow-hidden aspect-square shadow-2xl"
          >
            <img src="/images/import-recipe.jpg" alt="Scanning a recipe" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-terracotta rounded-xl flex items-center justify-center text-white">
                  <ScanLine className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-charcoal">{t('home.feature1_img_badge1')}</p>
                  <p className="text-sm text-stone">{t('home.feature1_img_badge2')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2 bg-white p-10 lg:p-12 rounded-[40px] shadow-xl border border-stone-light/20"
          >
            <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mb-6">
              <ScanLine className="w-8 h-8 text-terracotta" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-heading text-neutral-800 leading-[1.1] mb-6">{t('home.feature1_title')}</h2>
            <p className="text-lg text-brown mb-8 leading-relaxed">
              {t('home.feature1_desc')}
            </p>
            <ul className="space-y-4">
              {[t('home.feature1_list1'), t('home.feature1_list2'), t('home.feature1_list3')].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-stone-dark font-medium">
                  <div className="w-6 h-6 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Feature Section 2 */}
      <section className="py-24 bg-cream">
        <div className="page-container grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-1"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <CalendarDays className="w-8 h-8 text-terracotta" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-heading text-neutral-800 leading-[1.1] mb-6">{t('home.feature2_title')}</h2>
            <p className="text-lg text-brown mb-8 leading-relaxed">
              {t('home.feature2_desc')}
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-terracotta font-semibold hover:gap-3 transition-all">
              Essayer le planificateur <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-2 relative rounded-[40px] overflow-hidden aspect-square shadow-2xl"
          >
            <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80" alt="Meal planning" className="w-full h-full object-cover" />
            <div className="absolute top-8 right-8">
              <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl w-48 rotate-3">
                <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-2">{t('home.feature2_img_badge1')}</p>
                <div className="bg-cream p-2 rounded-lg flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-terracotta" />
                  <span className="text-sm font-medium">{t('home.feature2_img_badge2')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section 3 */}
      <section className="py-24 bg-white">
        <div className="page-container grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1 relative rounded-[40px] overflow-hidden aspect-square shadow-2xl"
          >
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" alt="Grocery shopping" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-3 border-b border-stone-light/50 pb-3">
                  <div className="w-6 h-6 rounded-md bg-terracotta/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-sm bg-terracotta"></div>
                  </div>
                  <span className="font-medium text-charcoal line-through opacity-60">{t('home.feature3_img_badge1')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md border-2 border-stone-light flex items-center justify-center"></div>
                  <span className="font-medium text-charcoal">{t('home.feature3_img_badge2')}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2 bg-white p-10 lg:p-12 rounded-[40px] shadow-xl border border-stone-light/20"
          >
            <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-terracotta" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-heading text-neutral-800 leading-[1.1] mb-6">{t('home.feature3_title')}</h2>
            <p className="text-lg text-brown mb-8 leading-relaxed">
              {t('home.feature3_desc')}
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-terracotta font-semibold hover:gap-3 transition-all">
              Découvrir le garde-manger <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>


    </div>
  );
}
