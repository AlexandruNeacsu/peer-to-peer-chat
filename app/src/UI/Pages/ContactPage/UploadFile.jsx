import React from "react";
import { IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { DropzoneArea } from "material-ui-dropzone";
import { t } from "react-i18nify";

export default function UploadFile({ handleClose, handleChange }) {
  return (
    <div>

      <div>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </div>

      <DropzoneArea
        dropzoneText={t("TODO")} // TODO
        maxFileSize={10 * 2 ** 20} // 10 MB
        filesLimit={10}
        acceptedFiles={[""]} // accept all files
        showFileNames
        onChange={handleChange}
      />

    </div>
  );
}
