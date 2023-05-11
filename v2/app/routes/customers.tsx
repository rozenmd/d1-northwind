import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import { Paginate } from "~/components/Paginate";
import { useStatsDispatch } from "~/components/StatsContext";
import { client } from "~/db/client.server";
import { customers } from "~/db/schema";
import type { LoaderFunction } from "@remix-run/cloudflare";

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const itemsPerPage = 20;
  const page = Number(url.searchParams.get("page")) || 1;
  const count = url.searchParams.get("count");
  const search = url.searchParams.get("search");
  const allCustomers = await client(context.DB)
    .select()
    .from(customers)
    .limit(itemsPerPage)
    .offset((page - 1) * itemsPerPage)
    .get();

  const rand = Math.floor(Math.random() * 1000001);
  const path = `https://v2-worker.rozenmd.workers.dev/api/customers?page=${page}${
    Number(count) > 0 ? `` : `&count=true`
  }${search ? `&search=${search}` : ""}&rand=${rand}`;

  const res = await fetch(path);
  const result = (await res.json()) as any;

  return json({ ...result, allCustomers });
};
type LoaderType = Awaited<ReturnType<typeof loader>>;
interface Customer {
  Id: string;
  CompanyName: string;
  ContactName: string;
  ContactTitle: string;
  Address: string;
  City: string;
  Country: string;
  Phone: string;
}
const Customers = () => {
  const data = useLoaderData<LoaderType>();
  const navigate = useNavigate();
  const { customers, page, pages } = data;
  console.log("data", data);
  const dispatch = useStatsDispatch();

  useEffect(() => {
    dispatch && data.stats && dispatch(data.stats);
  }, [dispatch, data.stats]);

  const setPage = (page: number) => {
    navigate(`/customers?page=${page}`);
  };

  return (
    <>
      {customers.length ? (
        <div className="card has-table">
          <header className="card-header">
            <p className="card-header-title">Customers</p>
            <button className="card-header-icon">
              <span
                className="material-icons"
                onClick={() => {
                  //eslint-disable-next-line
                  window.location.href = window.location.href;
                }}
              >
                redo
              </span>
            </button>
          </header>
          <div className="card-content">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Title</th>
                  <th>City</th>
                  <th>Country</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: Customer, index: number) => {
                  return (
                    <tr key={index}>
                      <td className="image-cell">
                        <div className="image">
                          <img
                            alt="Customer avatar"
                            src={`https://avatars.dicebear.com/v2/initials/${
                              customer.ContactName.split(" ")[0]
                            }-${
                              customer.ContactName.split(" ").slice(-1)[0]
                            }.svg`}
                            className="rounded-full"
                          />
                        </div>
                      </td>
                      <td data-label="Company">
                        <Link className="link" to={`/customer/${customer.Id}`}>
                          {customer.CompanyName}
                        </Link>
                      </td>
                      <td data-label="Contact">{customer.ContactName}</td>
                      <td data-label="Title">{customer.ContactTitle}</td>
                      <td data-label="City">{customer.City}</td>
                      <td data-label="Country">{customer.Country}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Paginate pages={pages} page={page} setPage={setPage} />
          </div>
        </div>
      ) : (
        <div className="card-content">
          <h2>No results</h2>
        </div>
      )}
    </>
  );
};

export default Customers;
