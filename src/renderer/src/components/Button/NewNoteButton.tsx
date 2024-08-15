import { ActionButton, type ActionButtonProps } from "@/components"
import { createEmptyNoteAtom } from "@renderer/store"
import { useSetAtom } from "jotai"
import { LuFileSignature } from "react-icons/lu"

export const NewNoteButton = ({ ...props }: ActionButtonProps) => {
  const createEmptyNote = useSetAtom(createEmptyNoteAtom)

  const handleCreation = async () => {
    await createEmptyNote()
  }

  return (
    <ActionButton onClick={handleCreation} {...props}>
      <LuFileSignature className="size-4 text-zinc-300" />
    </ActionButton>
  )
}
