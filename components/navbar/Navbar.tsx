import Container from '../global/Container';
import CartButton from './CartButton';
import Logo from './Logo';
import NavSearch from './NavSearch';

export default function Navbar() {
  return (
    <nav className="border-b">
      <Container className="flex flex-col sm:flex-row sm:justify-between sm:items-center flex-wrap gap-4 py-8">
        <Logo />
        <NavSearch />
        <div className="flex gap-4 items-center">
          <CartButton />
        </div>
      </Container>
    </nav>
  );
}
