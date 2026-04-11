import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Zap, Target, Users } from 'lucide-react'
import { BACKEND_URL } from '@/config/env';

export default function Landing() {
  return (
    <div className="min-h-dvh font-sans bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">P</div>
            <span className="font-bold text-lg text-foreground">Prep Hub</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground transition">Features</a>
            <a href="#resources" className="text-foreground/70 hover:text-foreground transition">Resources</a>
            <a href="#pricing" className="text-foreground/70 hover:text-foreground transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="inline-flex" onClick={() => {window.location.href = `${BACKEND_URL}/login`;}}>
              Sign In
            </Button>
            <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Your Central Hub for Exam Preparation
              </h1>
              <p className="text-lg text-foreground/70 leading-relaxed text-balance">
                Access thousands of previous years&apos; questions, comprehensive study materials, and expert-curated resources to ace your exams with confidence.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg h-12">
                Start Preparing <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-muted/50 text-lg h-12">
                Explore Resources
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-foreground/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>50K+ Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Expert Solutions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>100% Free</span>
              </div>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl backdrop-blur-sm border border-border/50 flex items-center justify-center p-8">
              <div className="space-y-6 w-full">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-foreground">Exam Success Rate</h3>
                    <span className="text-primary font-bold text-lg">+85%</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                    </div>
                    <p className="text-xs text-foreground/60">Students passing with flying colors</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 text-center">
                    <p className="text-2xl font-bold text-primary">25K+</p>
                    <p className="text-xs text-foreground/60 mt-1">Active Learners</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 text-center">
                    <p className="text-2xl font-bold text-primary">10Y+</p>
                    <p className="text-xs text-foreground/60 mt-1">Question Archive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="space-y-16">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-foreground/70 text-balance">
              Comprehensive tools and resources designed to help you prepare efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1 */}
            <div className="group bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Previous Years Questions</h3>
              <p className="text-foreground/70">Access 50,000+ carefully curated PYQs from the last 10 years organized by topic and difficulty.</p>
            </div>

            {/* Feature Card 2 */}
            <div className="group bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Smart Learning Path</h3>
              <p className="text-foreground/70">Adaptive study sequences that adjust to your skill level and learning pace for optimal results.</p>
            </div>

            {/* Feature Card 3 */}
            <div className="group bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Detailed Solutions</h3>
              <p className="text-foreground/70">Step-by-step explanations for every question with multiple solving approaches and tips.</p>
            </div>

            {/* Feature Card 4 */}
            <div className="group bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Community Support</h3>
              <p className="text-foreground/70">Learn from thousands of students, discuss doubts with experts, and share solutions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 border-y border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <p className="text-4xl md:text-5xl font-bold text-primary">25K+</p>
            <p className="text-foreground/70 text-sm">Active Students</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-4xl md:text-5xl font-bold text-primary">50K+</p>
            <p className="text-foreground/70 text-sm">PYQs Available</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-4xl md:text-5xl font-bold text-primary">4.9★</p>
            <p className="text-foreground/70 text-sm">Avg Rating</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-4xl md:text-5xl font-bold text-primary">100%</p>
            <p className="text-foreground/70 text-sm">Free Forever</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border border-border p-12 md:p-20">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm -z-10"></div>
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                Ready to Excel in Your Exams?
              </h2>
              <p className="text-lg text-foreground/70 text-balance">
                Join thousands of successful students who trust Prep Hub for their exam preparation journey.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg h-12 sm:w-auto">
                Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-white/10 text-lg h-12">
                Browse Free Resources
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition">Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-foreground transition">About</a></li>
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">License</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Social</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-foreground transition">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-foreground transition">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">P</div>
              <span className="font-semibold text-foreground">Prep Hub</span>
            </div>
            <p className="text-sm text-foreground/60">© 2024 Prep Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
