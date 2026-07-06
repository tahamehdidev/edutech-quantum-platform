import "./Card.css";

export function Card({ children, className = "", ...props }) {
  return (
    <div className={["card", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
