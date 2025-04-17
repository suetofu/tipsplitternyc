import { Route, Switch } from "wouter";
import Layout from "@/components/Layout";
import Setup from "@/pages/Setup";
import Employees from "@/pages/Employees";
import NewShift from "@/pages/NewShift";
import EditShift from "@/pages/EditShift";
import Results from "@/pages/Results";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Setup} />
        <Route path="/setup" component={Setup} />
        <Route path="/employees" component={Employees} />
        <Route path="/new-shift" component={NewShift} />
        <Route path="/edit-shift/:id" component={EditShift} />
        <Route path="/results" component={Results} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
