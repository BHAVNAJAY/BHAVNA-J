import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import AchievementsFlipbook from "@/components/AchievementsFlipbook";
import ContactSection from "@/components/ContactSection";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";
import { MotionProvider } from "@/components/MotionProvider";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { resume } from "@/data/portfolio";

/**
 * Checked at build time (the page is statically generated), so the site
 * never links to a resume that isn't there and never makes a failing request.
 * Add public/resume.pdf and redeploy — the buttons switch on automatically.
 */
function publicFileExists(webPath: string) {
  if (!webPath || /^https?:/.test(webPath)) return !!webPath;
  return existsSync(join(process.cwd(), "public", webPath.replace(/^\//, "")));
}

export default function Home() {
  const resumeAvailable = publicFileExists(resume.path);
  return (
    <MotionProvider>
      <a href="#about" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <AchievementsFlipbook />
        <ContactSection resumeAvailable={resumeAvailable} />
      </main>
      <Footer />
    </MotionProvider>
  );
}
