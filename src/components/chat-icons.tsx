import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="20"
      {...props}
    >
      {children}
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </BaseIcon>
  )
}

export function MoreIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v.01" />
      <path d="M12 12v.01" />
      <path d="M12 19v.01" />
    </BaseIcon>
  )
}

export function NewChatIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14 4h6" />
      <path d="M17 1v6" />
      <path d="M5 18.5 3 21l2.8-.7A9 9 0 1 0 5 18.5Z" />
    </BaseIcon>
  )
}

export function EmojiIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10h.01" />
      <path d="M15.5 10h.01" />
      <path d="M8.5 14.5c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" />
    </BaseIcon>
  )
}

export function AttachmentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9.5 12.5 5.8-5.8a3 3 0 1 1 4.2 4.2l-7.9 7.9a5 5 0 0 1-7.1-7.1l8.4-8.4" />
    </BaseIcon>
  )
}

export function MicIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v3" />
    </BaseIcon>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 11.5 20 4l-4.6 16-3.4-6.1L4 11.5Z" />
      <path d="M11.8 13.8 20 4" />
    </BaseIcon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </BaseIcon>
  )
}

export function ArrowChevronIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9 6 6 6-6 6" />
    </BaseIcon>
  )
}
