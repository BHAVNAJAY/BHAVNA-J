import { contact } from "@/data/portfolio";
import styles from "@/styles/sections.module.css";

export default function Footer() {
  return (
    <footer className={`${styles.footer} starfield`}>
      <div className={`container ${styles.footerInner}`}>
        <span>{contact.footer}</span>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  );
}
