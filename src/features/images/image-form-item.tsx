import { Loader } from "@/components/nowts/loader";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { toast } from "sonner";
import { NativeTargetBox } from "./native-target-box";
import { uploadImageAction } from "./upload-image.action";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageFormItemProps = {
  onChange: (url: string) => void;
  onRemove?: () => void;
  imageUrl?: string | null;
  className?: string;
};

export const ImageFormItem = ({
  onChange,
  onRemove,
  imageUrl,
  className,
}: ImageFormItemProps) => {
  const currentImage = imageUrl;
  const hasImage = currentImage && currentImage !== "/images/placeholder.svg";

  return (
    <div
      className={cn(
        "bg-muted group relative aspect-square h-32 overflow-hidden rounded-md border",
        className,
      )}
    >
      {hasImage ? (
        <img
          src={currentImage}
          className="absolute inset-0 object-contain object-center"
          alt=""
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
          <p className="text-sm text-muted-foreground">Click or drag to upload</p>
        </div>
      )}
      <UseImageUpload onChange={onChange} hasImage={!!hasImage} />
      {hasImage && onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 z-20 size-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
};

const Overlay = (props: PropsWithChildren<{ isLoading?: boolean }>) => {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center opacity-0 transition-opacity",
        {
          "group-hover:bg-background/70 group-hover:opacity-100":
            !props.isLoading,
          "bg-background/70 opacity-100": props.isLoading,
        },
      )}
    >
      {props.children}
    </div>
  );
};

const UseImageUpload = ({ onChange }: { onChange: (url: string) => void; hasImage: boolean }) => {
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert File to base64 on client side (FileReader is browser-only API)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadImageAction({
        base64,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      if (!isActionSuccessful(result)) {
        toast.error(result.serverError ?? "Something went wrong");
        return;
      }

      onChange(result.data);
    },
  });

  const handleDrop = async (item: { files: File[] }) => {
    const file = item.files[0] as File;

    const validFiles = ["image/png", "image/jpeg", "image/jpg"];

    if (!validFiles.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Only png, jpg, jpeg are allowed",
      });
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error("File too large (max 1mb)", {
        description: "https://tinypng.com/ to compress the image",
      });
      return;
    }

    uploadImageMutation.mutate(file);
  };

  return (
    <Overlay isLoading={uploadImageMutation.isPending}>
      <NativeTargetBox
        className="absolute inset-0 flex h-auto items-center justify-center"
        isLoading={uploadImageMutation.isPending}
        onDrop={handleDrop}
        accept={["*.png"]}
      >
        {uploadImageMutation.isPending ? <Loader /> : <></>}
      </NativeTargetBox>
    </Overlay>
  );
};
