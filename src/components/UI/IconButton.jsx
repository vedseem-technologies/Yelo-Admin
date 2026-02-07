import React from "react";
import "./IconButton.css";

/**
 * IconButton - Standardized icon button component for Edit/Delete actions
 * Uses Material Symbols Outlined icons
 *
 * @param {string} icon - Icon name ('edit' or 'delete')
 * @param {function} onClick - Click handler
 * @param {string} title - Tooltip text
 * @param {string} variant - Button variant ('default' or 'danger')
 * @param {boolean} disabled - Disabled state
 * @param {string} ariaLabel - Accessible label for screen readers
 */
function IconButton({
  icon,
  onClick,
  title,
  variant = "default",
  disabled = false,
  ariaLabel,
  className = "",
}) {
  const iconName =
    icon === "edit" ? "edit" : icon === "delete" ? "delete" : icon;
  const effectiveAriaLabel = ariaLabel || title || `${icon} button`;

  return (
    <button
      className={`icon-btn-standard ${variant} ${className}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-label={effectiveAriaLabel}
      type="button"
    >
      <span className="material-symbols-outlined">{iconName}</span>
    </button>
  );
}

export default IconButton;
