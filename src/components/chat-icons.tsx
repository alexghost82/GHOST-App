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

export function BellOutlineIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4a4 4 0 0 0-4 4v2.4L6.2 13v1.2h11.6V13L16 10.4V8a4 4 0 0 0-4-4Z" />
      <path d="M10.1 16a2.2 2.2 0 0 0 3.8 0" />
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

export function LockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="7" y="10" width="10" height="9" rx="2.2" />
      <path d="M9.5 10V8.3a2.5 2.5 0 0 1 5 0V10" />
      <path d="M12 13.1v2.2" />
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

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  )
}

export function ChatBubbleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5.5 18.5 3 21l.9-3.4A8.5 8.5 0 1 1 20.5 12c0 4.7-3.8 8.5-8.5 8.5H5.5Z" />
    </BaseIcon>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M16.5 18.5v-.8a3.7 3.7 0 0 0-3.7-3.7H7.9a3.7 3.7 0 0 0-3.7 3.7v.8" />
      <circle cx="10.35" cy="8.35" r="3.1" />
      <path d="M17.2 14.2a3.2 3.2 0 0 1 3 3.2v1.1" />
      <path d="M15.8 5.7a3 3 0 0 1 0 5.3" />
    </BaseIcon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.3 19.2a6.7 6.7 0 0 1 13.4 0" />
    </BaseIcon>
  )
}

export function RadioWavesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 17.5a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
      <path d="M8.4 14.3a5.2 5.2 0 0 1 7.2 0" />
      <path d="M5.2 11.2a9.7 9.7 0 0 1 13.6 0" />
      <path d="M2.3 8a14 14 0 0 1 19.4 0" />
    </BaseIcon>
  )
}

export function PhoneChatIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M18.4 14.7a8.8 8.8 0 0 0 1.8-5.3A8.9 8.9 0 0 0 11.3.5 8.9 8.9 0 0 0 3 13.1L2 17l4-.9a8.8 8.8 0 0 0 4.9 1.5c1.7 0 3.3-.5 4.7-1.3" />
      <path d="M13.6 13.6c1.3 1.2 2.8 2 4.5 2.4l1.7-1.7a1.1 1.1 0 0 1 1.1-.27l1.5.47a1.1 1.1 0 0 1 .77 1.05v2.11A1.31 1.31 0 0 1 21.8 19c-5.25 0-9.5-4.25-9.5-9.5a1.31 1.31 0 0 1 1.31-1.31h2.11a1.1 1.1 0 0 1 1.05.77l.47 1.5a1.1 1.1 0 0 1-.27 1.1l-1.7 1.7" />
    </BaseIcon>
  )
}

export function HomeLiveIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10.2 12 4l8 6.2v8.1a1.7 1.7 0 0 1-1.7 1.7H5.7A1.7 1.7 0 0 1 4 18.3v-8.1Z" />
      <path d="M12 12.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
      <path d="M8.8 10.5a4.6 4.6 0 0 1 6.4 0" />
      <path d="M6.4 8.2a8.2 8.2 0 0 1 11.2 0" />
    </BaseIcon>
  )
}
