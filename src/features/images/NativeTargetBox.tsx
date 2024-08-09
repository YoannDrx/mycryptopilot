import React, {
  ComponentPropsWithoutRef,
  forwardRef,
  useRef,
  useState,
} from "react";

type DragAndDropProps = {
  onFileDrop: (item: { files: File[] }) => unknown;
  children?: React.ReactNode;
  isLoading?: boolean;
  accept?: string[];
} & ComponentPropsWithoutRef<"div">;

/**
 * NativeTargetBox enable user to drag and drop files into the component.
 *
 * This component avoid you to install library only to handle drag and drop.
 *
 * @param accept - The file types that are allowed to be dropped. Ex: ['*.png']
 * @param onDrop - The function that will be called when a file is dropped.
 * @param children - The content that will be displayed when the user drops a file.
 * @param isLoading - If true, the component will display a loading state.
 * @param props - The rest of the props that will be passed to the div element.
 */
export const NativeTargetBox = forwardRef<HTMLDivElement, DragAndDropProps>(
  ({ onFileDrop, children, isLoading, accept, ...props }, ref) => {
    const [isDrop, setIsDrop] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      props.onDragOver?.(e);
      if (isLoading) return;
      e.preventDefault();
      setIsDrop(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      props.onDragLeave?.(e);
      if (isLoading) return;
      e.preventDefault();
      setIsDrop(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      if (isLoading) return;
      e.preventDefault();
      setIsDrop(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        accept?.some((type) => {
          const regex = new RegExp(type.replace("*", ".*"), "i");
          return file.type.match(regex) ?? file.name.match(regex);
        }),
      );

      if (files.length) {
        onFileDrop({ files });
      }
    };

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      props.onClick?.(event);
      if (inputRef.current) {
        inputRef.current.click();
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((file) =>
        accept?.some((type) => {
          const regex = new RegExp(type.replace("*", ".*"), "i");
          return file.type.match(regex) ?? file.name.match(regex);
        }),
      );

      if (files.length) {
        onFileDrop({ files });
      }
    };

    return (
      <div
        {...props}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          cursor: "pointer",
        }}
        ref={ref}
      >
        {children}
        <input
          type="file"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleInputChange}
          accept={accept?.join(",")}
          multiple
        />
      </div>
    );
  },
);

NativeTargetBox.displayName = "NativeTargetBox";
