import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-background relative overflow-hidden">
      {/* Thin gradient line at the top */}
      <div className="h-[2px] w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-50" />
      
      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/5 blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <img src="/logo.png" alt="AfroMuse AI" className="h-8 w-auto grayscale brightness-200" />
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Afro<span className="text-primary">Muse</span>.ai
              </span>
            </Link>
            <p className="text-primary text-sm font-medium tracking-wide uppercase mb-4 opacity-80">
              The AI Studio for Afrobeat Artists
            </p>
            <p className="text-white/70 text-base max-w-sm leading-relaxed font-medium">
              AfroMuse AI is where Afrobeat artists come to write faster, create bolder, and build a sound that's entirely their own.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Studio</h4>
            <ul className="space-y-3">
              <li><Link href="/studio" className="text-sm text-muted-foreground hover:text-primary transition-colors">Studio</Link></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/projects" className="text-sm text-muted-foreground hover:text-primary transition-colors">Song Library</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="mailto:afromuseai@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AfroMuse AI. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Twitter */}
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            {/* TikTok */}
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
