import TestList from './TestList';
import {fimidaraJsSdkUITests} from './tests';
import {useTestRunner} from './useTestRunner';

function App() {
  const {tests, controller} = useTestRunner({
    submittedTests: fimidaraJsSdkUITests,
  });

  return <TestList controller={controller} tests={tests} />;
}

export default App;
