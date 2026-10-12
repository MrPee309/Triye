import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-10 text-center">
      <h1 className="text-2xl font-bold">Paj sa a pa egziste.</h1>
      <Link href="/dashboard" className="mt-4 inline-block font-bold text-sea underline">
        Retounen nan Akèy
      </Link>
    </div>
  );
}
