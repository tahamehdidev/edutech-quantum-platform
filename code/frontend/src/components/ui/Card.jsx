import "./Card.css";

// `as` defaults to "div" (every existing call site is unaffected) -- added for DashboardPage's
// instructor sections, which need a real <section> landmark (so the h2s inside are reachable via
// heading/landmark navigation) while still getting Card's own elevation/padding styling, same
// reasoning as RevealSection.jsx's own `as` prop.
export function Card({ as: Tag = "div", children, className = "", ...props }) {
  return (
    <Tag className={["card", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Tag>
  );
}
