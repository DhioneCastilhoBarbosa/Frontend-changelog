import ReleaseTable from "./components/table";

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col md:overflow-hidden overflow-auto items-center">
      {/* Área da tabela com rolagem */}
      <div className="flex-1 md:overflow-y-auto p-6 pt-1 md:w-5/6 w-full mt-10">
        <ReleaseTable />
      </div>
    </div>
  );
}
