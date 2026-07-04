export default function LeaveTable({ leaves, loading }) {
  const getStatusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";

      case "REJECTED":
        return "text-rose-700 bg-rose-50 border-rose-200";

      default:
        return "text-amber-700 bg-amber-50 border-amber-200";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* DESKTOP TABLE */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 uppercase text-[11px] tracking-[0.15em] font-bold text-slate-500">
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4 text-center">Days</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-16 text-center text-slate-400"
                >
                  Loading leaves...
                </td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-16 text-center text-sm font-medium text-slate-400"
                >
                  No leave applications found
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <>
                  <tr
                    key={leave.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-all"
                  >
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-slate-800">
                        {leave.type}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-800">
                          {new Date(
                            leave.startDate,
                          ).toLocaleDateString()}
                        </span>

                        <span className="text-xs text-slate-400">
                          to{" "}
                          {new Date(
                            leave.endDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 max-w-xs">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {leave.reason}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-semibold text-slate-700">
                        {leave.days || 1}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusStyle(
                          leave.status,
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                  </tr>

                  {/* REJECTION NOTE */}
                  {leave.status === "REJECTED" &&
                    leave.reviewNote && (
                      <tr className="bg-rose-50/30 border-t border-rose-100">
                        <td
                          colSpan="5"
                          className="px-6 py-4"
                        >
                          <div className="flex gap-3">
                            <div className="w-1 rounded-full bg-rose-500" />

                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 mb-1">
                                Rejection Reason
                              </p>

                              <p className="text-sm text-rose-600">
                                {leave.reviewNote}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE + TABLET CARDS */}
      <div className="lg:hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading leaves...
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400">
            No leave applications found
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="p-5 space-y-4"
              >
                {/* TOP */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {leave.type}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(
                        leave.startDate,
                      ).toLocaleDateString()}{" "}
                      —{" "}
                      {new Date(
                        leave.endDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-semibold border whitespace-nowrap ${getStatusStyle(
                      leave.status,
                    )}`}
                  >
                    {leave.status}
                  </span>
                </div>

                {/* REASON */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Reason
                  </p>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {leave.reason}
                  </p>
                </div>

                {/* DAYS */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Total Days
                  </p>

                  <span className="text-sm font-semibold text-slate-700">
                    {leave.days || 1}
                  </span>
                </div>

                {/* REJECTION NOTE */}
                {leave.status === "REJECTED" &&
                  leave.reviewNote && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 mb-1">
                        Rejection Reason
                      </p>

                      <p className="text-sm text-rose-600">
                        {leave.reviewNote}
                      </p>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}