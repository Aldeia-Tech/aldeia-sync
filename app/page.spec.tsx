import { render, screen } from '@testing-library/react';
import Home from './page';

describe('<Home />', () => {
  it('should render Home', () => {
    const { container } = render(<Home />);
    const homeTitle = screen.getByTestId('home-title');
    const homeCopyright = screen.getByTestId('home-copyright');
    expect(container).toBeInTheDocument();
    expect(homeTitle).toHaveTextContent('Aldeia Tech');
    expect(homeCopyright).toHaveTextContent(
      'todos dos direitos resevados ao AldeiaTech ©',
    );
  });
});
