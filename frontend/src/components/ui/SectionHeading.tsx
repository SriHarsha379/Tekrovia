interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({ eyebrow, title, description, align = "left" }: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex max-w-2xl flex-col gap-3 ${alignClass}`}>
      {eyebrow && <p className="font-body text-sm font-medium text-teal">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-medium leading-tight sm:text-4xl">{title}</h2>
      {description && <p className="font-body text-lg text-ink/70">{description}</p>}
    </div>
  );
}
