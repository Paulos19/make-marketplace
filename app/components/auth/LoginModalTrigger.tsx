
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { LoginModal } from "./LoginModal";

export function LoginModalTrigger() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000); // Delay de 2 segundos para abrir o modal

      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return <LoginModal isOpen={isOpen} onClose={handleClose} />;
}
